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

    const newsText = items
        .slice(0, 30)
        .map((item, i) => `${i + 1}. [${item.brand || '市场'}] ${item.title} (${item.date})`)
        .join('\n');

    const systemPrompt = `你是长安汽车出海中东业务的战略情报官。
根据以下今日收集的阿联酋市场资讯列表，生成一份高管视角的【每日商业简报】。
你的目标是**从零散的信息中发现战略威胁与趋势**，而不是简单的机器翻译。

简报绝对格式要求：
## 中东大区市场简报 · ${new Date().toISOString().split('T')[0]}

**🚨 核心战略预警**
(如果竞品有重大价格调整、爆款新车发布、或对长安有直接威胁的政府政策，提炼 1-2 条。必须点出"为什么危险"或"带来什么压力"。)

**🎯 长安/中国品牌动向**
(总结长安及其他核心出海品牌如比亚迪、奇瑞的动作，说明这些动作对整体市场格局的意义。)

**⚔️ 竞品战术观测**
(总结日韩传统品牌或当地渠道的防御性战术操作，如促销、延保、政府大单等，3条以内。)

**🌍 大盘背景**
(用一句话高度概括当天的整体中东汽车市场冷暖温度或宏观事件。)

---
【极其重要的规则】：
1. 语言必须高度精炼、客观、具有咨询公司级的专业感。
2. 绝对克制，禁止使用浮夸的网络文学和情绪化词汇（如：如临大敌、惨烈作战、霸气登场等）。
3. 每条总结必须提炼出 "So What (业务影响)"，不能只描述表面事件。
4. 宁缺毋滥：如果某项没有实质性高价值情报，直接整块省略该板块。
5. 只输出纯文本 Markdown，不要加任何其他客套话。`;

    const { response, data } = await callQwen(
        apiKey,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `以下是今日资讯列表：\n${newsText}` },
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
