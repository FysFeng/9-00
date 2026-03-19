/**
 * /api/cron.js  —  一键全流程接口（供 GitHub Actions 定时调用）
 *
 * 执行链路：
 *   1. 验证 x-cron-secret 请求头
 *   2. 从多个 RSS 源抓取昨日至今的原始新闻条目（最多取 30 条）
 *   3. 逐条调用 Qwen 进行相关性筛选 & 结构化提炼
 *   4. 调用 Qwen 生成《中东大区市场简报》
 *   5. 推送至企业微信群机器人 Webhook
 *
 * 触发方式:
 *   POST /api/cron
 *   Header: x-cron-secret: <CRON_SECRET>
 *
 * 所需环境变量 (在 Vercel 项目设置中配置):
 *   CRON_SECRET         — 防止未经授权调用的密钥
 *   DASHSCOPE_API_KEY   — 通义千问 API Key
 *   WEBHOOK_URL         — 企业微信群机器人 Webhook 地址
 *   WEBHOOK_TYPE        — 推送平台: wechat | dingtalk | lark （默认 wechat）
 */

import * as cheerio from 'cheerio';

// ── 常量配置 ────────────────────────────────────────────────────────────
const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 自动采集的 RSS 源（与 collect.js 保持同步）
const FIXED_SOURCES = [
    { name: 'DriveArabia', url: 'https://www.drivearabia.com/news/feed/' },
    { name: 'YallaMotor UAE', url: 'https://uae.yallamotor.com/car-news/rss' },
    { name: 'Autocar Middle East', url: 'https://www.autocarme.com/rss' },
    { name: 'Gulf News Auto', url: 'https://gulfnews.com/rss/business/auto' },
    { name: 'Khaleej Times Auto', url: 'https://www.khaleejtimes.com/business/auto.xml' },
    { name: 'Arabian Business', url: 'https://www.arabianbusiness.com/rss' },
    { name: 'The National UAE', url: 'https://www.thenationalnews.com/rss/vehicle.xml' },
    { name: 'WAM English', url: 'https://wam.ae/en/rss' },
    { name: 'RTA Dubai News', url: 'https://www.rta.ae/wps/content/connect/rta/site/en/news/all-news-feed' },
];

const GOOGLE_NEWS_KEYWORDS = [
    // === Changan Focus ===
    'Changan car UAE launch',
    'Changan Uni UAE price',
    'Changan electric vehicle UAE',
    // === Chinese Challengers ===
    'BYD UAE price',
    'MG Motor UAE new model',
    'Chery Tiggo UAE launch',
    'Omoda UAE price',
    'Geely Monjaro UAE',
    'GAC Aion UAE electric',
    'Jetour UAE launch',
    // === Market & Infrastructure ===
    'UAE car sales figures 2025',
    'Dubai Motor Show 2025',
    'Dubai EV charging station DEWA',
    'UAE EV registration statistics',
    'RTA Dubai vehicle registration new rules',
    'UAE vehicle import regulation',
];

const toGoogleNewsRSS = (kw) => ({
    name: `GNews: ${kw}`,
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=en&gl=AE&ceid=AE:en`,
});

const ALL_SOURCES = [
    ...FIXED_SOURCES,
    ...GOOGLE_NEWS_KEYWORDS.map(toGoogleNewsRSS),
];


// ── 工具函数 ────────────────────────────────────────────────────────────

async function fetchSingleRSS(source, cutoffTime) {
    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(source.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)', Accept: 'application/rss+xml, */*' },
            signal: controller.signal,
        });
        clearTimeout(tid);
        if (!response.ok) return [];

        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const items = [];

        $('item').each((i, el) => {
            if (i >= 10) return; // 每个源最多取 10 条，控制总量
            const pubTime = new Date($(el).find('pubDate').text().trim()).getTime();
            if (isNaN(pubTime) || pubTime < cutoffTime) return;

            const title = $(el).find('title').text().trim().replace(/\s*<!\[CDATA\[|\]\]>/g, '');
            const link = $(el).find('link').text().trim() || $(el).find('link').attr('href') || '';
            const desc = $(el).find('description').text().replace(/<[^>]*>?/gm, '').substring(0, 150).trim();

            if (title && link) {
                items.push({
                    source: source.name,
                    title,
                    url: link,
                    date: new Date(pubTime).toISOString().split('T')[0],
                    rawDate: pubTime,
                    snippet: desc,
                });
            }
        });

        return items;
    } catch {
        return [];
    }
}

async function callQwen(apiKey, messages, temperature = 0.1) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 55000);
    try {
        const response = await fetch(QWEN_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'qwen-plus',
                input: { messages },
                parameters: { result_format: 'message', temperature, top_p: 0.8 },
            }),
            signal: controller.signal,
        });
        clearTimeout(tid);
        return { response, data: await response.json() };
    } catch (err) {
        clearTimeout(tid);
        throw err;
    }
}

async function qwenAnalyzeItem(item, apiKey) {
    const systemPrompt = `你是中东汽车市场情报整理员。
你的任务是评估输入的新闻是否跟"阿联酋及海湾国家汽车市场"相关，并从中提取结构化情报。

【核心过滤规则】若新闻仅属于以下宏观事件但对阿联酋无直接业务影响，判定为不相关 (relevant: false)：
- 某品牌在欧美/南美的建厂或工会罢工
- 欧美针对中国电动车的关税与贸易摩擦
- 纯粹的公司高管人事或花边新闻

如果新闻与中东汽车市场高度相关，严格按以下 JSON 格式返回（必须是合法 JSON，不要返回 markdown 标记）：
{"relevant":true,"brand":"从预设列表选一个：['Changan 长安', 'BYD 比亚迪', 'Geely 吉利', 'MG 名爵', 'Chery 奇瑞', 'Jetour 捷途', 'GWM 长城', 'Toyota 丰田', 'Nissan 日产', 'Hyundai 现代', 'Kia 起亚', 'Lexus 雷克萨斯', 'Honda 本田', 'Ford 福特', 'GMC', 'Chevrolet 雪佛兰', 'Mercedes-Benz 奔驰', 'BMW 宝马', 'Audi 奥迪', 'Tesla 特斯拉', 'Volkswagen 大众', 'Land Rover 路虎', 'Exeed 星途', 'Omoda 欧萌达', 'Zeekr 极氪', 'Hongqi 红旗', 'NIO 蔚来', 'XPENG 小鹏', 'Deepal 深蓝', '政策相关', 'Other 其他品牌']","chineseTitle":"15字以内中文标题","type":"必须是以下之一：'Launch (Physical)'|'Tech & OTA'|'Market & Sales'|'Policy'|'Network & Service'|'Competitor Tactics'|'Corp Strategy'|'Other'","summary":"用一两句话陈述新闻事实，语言必须客观简洁，不要加主观看法，不要写'影响'或分析。","tags":["1-2个关键词"]}

如果不相关，直接返回：{"relevant":false}`;

    try {
        const { response, data } = await callQwen(apiKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `标题：${item.title}\n摘要：${item.snippet}\n来源：${item.source}` },
        ]);

        if (!response.ok) return null;
        const content = data.output?.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.relevant) return null;

        return {
            id: `cron-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brand: parsed.brand || 'Other 其他品牌',
            date: item.date,
            type: parsed.type || 'Other',
            title: parsed.chineseTitle || item.title,
            summary: parsed.summary || item.snippet,
            tags: parsed.tags || [],
            url: item.url,
            source: item.source,
        };
    } catch {
        return null;
    }
}

async function generateDigest(items, apiKey) {
    const dates = items.map(i => i.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? `${dates[0]} ~ ${dates[dates.length - 1]}` : new Date().toISOString().split('T')[0];

    const grouped = {};
    items.forEach(item => {
        const type = item.type || 'Other';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(`- [${item.brand}] ${item.title}：${item.summary || ''}`);
    });

    const groupedText = Object.entries(grouped)
        .map(([type, lines]) => `### ${type}\n${lines.slice(0, 8).join('\n')}`)
        .join('\n\n');

    const systemPrompt = `你是中东汽车市场信息整理员。请根据以下已按资讯类型分组的市场信息，生成一份简洁的【阿联酋每日信息简报】。

## 阿联酋每日信息简报
**信息覆盖时间：${dateRange}**

对于以下每个有内容的资讯类型，生成一个小节。无内容的类型直接省略：

### 新车发布
### 技术与OTA
### 销量与市场
### 政策与法规
### 渠道与售后
### 竞品动态
### 企业动态

【规则】：
1. 每小节列出 2-4 条新闻事实，每条必须包含品牌名。
2. 只陈述事实，不加主观分析、不写"影响"或"So What"。
3. 语言简洁，每条不超过 30 字。
4. 若某类型没有相关情报，直接跳过该小节。
5. 结尾不需要执行要点或行动建议。`;

    const { response, data } = await callQwen(apiKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `以下是已分组的情报列表：\n\n${groupedText}` },
    ], 0.3);

    if (!response.ok) throw new Error(`Qwen digest 生成失败: ${data.message || response.status}`);
    return data.output?.choices?.[0]?.message?.content || '';
}

async function pushToWebhook(digest, webhookUrl, webhookType = 'wechat') {
    let payload;
    const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const title = `长安中东情报简报 · ${today}`;

    // 企业微信 markdown 有 4096 字符限制，需截断
    const truncated = digest.length > 3800 ? digest.substring(0, 3800) + '\n\n…（内容过长，请登录平台查看完整报告）' : digest;

    if (webhookType === 'wechat') {
        payload = { msgtype: 'markdown', markdown: { content: truncated } };
    } else if (webhookType === 'dingtalk') {
        payload = { msgtype: 'markdown', markdown: { title, text: truncated } };
    } else if (webhookType === 'lark') {
        payload = { msg_type: 'interactive', card: { config: { wide_screen_mode: true }, elements: [{ tag: 'markdown', content: truncated }] } };
    } else {
        throw new Error(`不支持的 webhook 类型: ${webhookType}`);
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
    });
    clearTimeout(tid);

    const respData = await response.json().catch(() => ({}));
    if (!response.ok || (respData.errcode && respData.errcode !== 0)) {
        throw new Error(respData.errmsg || `Webhook 推送失败: HTTP ${response.status}`);
    }
    return true;
}

// ── 主 Handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // 1. 身份验证
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return res.status(503).json({ error: '服务器未配置 CRON_SECRET' });

    const incomingSecret = req.headers['x-cron-secret'];
    if (incomingSecret !== cronSecret) {
        return res.status(401).json({ error: '鉴权失败：x-cron-secret 不匹配' });
    }

    // 2. 检查必要环境变量
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: '未配置 DASHSCOPE_API_KEY' });

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return res.status(503).json({ error: '未配置 WEBHOOK_URL' });

    const webhookType = process.env.WEBHOOK_TYPE || 'wechat';

    console.log('[cron] 开始执行每日简报推送流程...');
    const startTime = Date.now();

    try {
        // 3. 抓取最近 1 天的 RSS 原始条目
        const cutoffTime = Date.now() - 1 * 24 * 60 * 60 * 1000;
        console.log('[cron] 步骤 1/4: 拉取 RSS 原始条目...');
        const results = await Promise.all(ALL_SOURCES.map(src => fetchSingleRSS(src, cutoffTime)));

        const seen = new Set();
        const rawItems = results.flat()
            .filter(item => {
                if (seen.has(item.title)) return false;
                seen.add(item.title);
                return true;
            })
            .sort((a, b) => b.rawDate - a.rawDate)
            .slice(0, 30); // 最多处理 30 条，避免超时

        console.log(`[cron] RSS 去重后共 ${rawItems.length} 条原始条目`);

        if (rawItems.length === 0) {
            return res.status(200).json({ success: true, message: '今日暂无新资讯，跳过推送', imported: 0 });
        }

        // 4. AI 筛选（串行，控制 QPS）
        console.log('[cron] 步骤 2/4: Qwen AI 筛选中...');
        const imported = [];
        for (const item of rawItems) {
            const result = await qwenAnalyzeItem(item, apiKey);
            if (result) imported.push(result);
            await new Promise(r => setTimeout(r, 300)); // 避免过快
        }

        console.log(`[cron] AI 筛选完成：${imported.length} 条相关，${rawItems.length - imported.length} 条过滤`);

        if (imported.length === 0) {
            return res.status(200).json({ success: true, message: '今日无相关市场情报，跳过推送', imported: 0 });
        }

        // 5. 生成简报
        console.log('[cron] 步骤 3/4: 生成 AI 简报...');
        const digest = await generateDigest(imported, apiKey);

        // 6. 推送到群聊
        console.log(`[cron] 步骤 4/4: 推送至 ${webhookType} Webhook...`);
        await pushToWebhook(digest, webhookUrl, webhookType);

        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`[cron] ✓ 推送成功，总耗时 ${elapsed}s`);

        return res.status(200).json({
            success: true,
            imported: imported.length,
            skipped: rawItems.length - imported.length,
            pushed: true,
            elapsedSeconds: elapsed,
        });

    } catch (err) {
        console.error('[cron] 执行失败:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
