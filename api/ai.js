/**
 * /api/ai.js  ─  merged AI handler (Qwen proxy + digest generator)
 *
 * Routes:
 *   POST /api/ai?action=analyze   → formerly /api/analyze (accepts { text, prompt })
 *   POST /api/ai?action=digest    → formerly /api/digest  (accepts { items })
 */

const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

async function callQwen(apiKey, messages, temperature = 0.1) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(QWEN_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
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

async function handleAnalyze(req, res, apiKey) {
    const { text, prompt } = req.body;
    const { response, data } = await callQwen(
        apiKey,
        [{ role: 'system', content: prompt }, { role: 'user', content: `News Text: ${text}` }],
        0.1,
    );
    if (!response.ok) {
        throw new Error(data.message || data.code || 'AI 服务响应异常');
    }
    return res.status(200).json(data);
}

async function handleDigest(req, res, apiKey) {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: '请传入至少一条资讯' });
    }

    // 计算时间范围
    const dates = items.map(i => i.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? `${dates[0]} ~ ${dates[dates.length - 1]}` : new Date().toISOString().split('T')[0];

    // 按资讯类型分组，并格式化给 AI
    const grouped = {};
    items.forEach(item => {
        const type = item.type || 'Other';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(`- [${item.brand || '市场'}] ${item.title}：${item.summary || ''}`);
    });

    const groupedText = Object.entries(grouped)
        .map(([type, lines]) => `### ${type}\n${lines.slice(0, 8).join('\n')}`)
        .join('\n\n');

    const systemPrompt = `你是中东汽车市场信息整理员。请根据以下已按资讯类型分组的市场信息，生成一份简洁的【阿联酋每日信息简报】。

【输出格式要求】（严格遵守，不可更改分类）：

## 阿联酋每日信息简报
**信息覆盖时间：${dateRange}**

对于以下每个有内容的资讯类型，生成一个小节。无内容的类型直接省略：

### 新车发布
（本周期内有哪些品牌发布了新车型？）

### 技术与OTA
（技术层面的重要动作，如智能化升级、电动化进展）

### 销量与市场
（各品牌的销量表现与市场行情）

### 政策与法规
（阿联酋/海湾地区出台了哪些汽车行业相关政策？）

### 渠道与售后
（经销商扩张、服务网络更新）

### 竞品动态
（竞品在价格、促销、服务上的动作）

### 企业动态
（品牌层面的战略合作、市场定位调整）

【规则】：
1. 每小节列出 2-4 条新闻事实，每条必须包含品牌名。
2. 只陈述事实，不加主观分析、不写"影响"或"So What"。
3. 语言简洁，每条不超过 30 字。
4. 若某类型没有相关情报，直接跳过该小节。
5. 结尾不需要执行要点或行动建议。`;

    const { response, data } = await callQwen(
        apiKey,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `以下是已分组的情报列表：\n\n${groupedText}` },
        ],
        0.3,
    );

    if (!response.ok) throw new Error(data.message || '调用 Qwen 失败');

    const digest = data.output?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ success: true, digest });
}

// ── Main Handler ────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-xxxx')) {
        return res.status(503).json({ error: '服务器配置错误: 未设置 DASHSCOPE_API_KEY 环境变量。' });
    }

    const action = req.query.action || '';

    try {
        if (action === 'analyze') return await handleAnalyze(req, res, apiKey);
        if (action === 'digest') return await handleDigest(req, res, apiKey);
        return res.status(400).json({ error: 'Missing query param: action=analyze|digest' });
    } catch (err) {
        console.error('[/api/ai]', err);
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: '服务器连接 AI 超时 (60s)，请稍后重试。' });
        }
        return res.status(500).json({ error: err.message });
    }
}
