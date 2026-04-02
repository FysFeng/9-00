/**
 * /api/ai.js
 *
 * Routes:
 *   POST /api/ai?action=analyze
 *   POST /api/ai?action=digest
 */

const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

async function callQwen(apiKey, messages, temperature = 0.1) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 60000);

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
                parameters: {
                    result_format: 'message',
                    temperature,
                    top_p: 0.8,
                },
            }),
            signal: controller.signal,
        });
        clearTimeout(timerId);
        return { response, data: await response.json() };
    } catch (error) {
        clearTimeout(timerId);
        throw error;
    }
}

async function handleAnalyze(req, res, apiKey) {
    const { text, prompt } = req.body;
    const { response, data } = await callQwen(
        apiKey,
        [
            { role: 'system', content: prompt },
            {
                role: 'user',
                content: `Analyze the following input.\n<input>\n${text || ''}\n</input>`,
            },
        ],
        0.1,
    );

    if (!response.ok) {
        throw new Error(data.message || data.code || 'AI service returned an error');
    }

    return res.status(200).json(data);
}

async function handleDigest(req, res, apiKey) {
    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
    }

    const dates = items.map((item) => item.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? `${dates[0]} ~ ${dates[dates.length - 1]}` : new Date().toISOString().split('T')[0];

    const grouped = {};
    items.forEach((item) => {
        const type = item.type || 'Other';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(`- [${item.brand || '市场'}] ${item.title}: ${item.summary || ''}`);
    });

    const groupedText = Object.entries(grouped)
        .map(([type, lines]) => `## ${type}\n${lines.slice(0, 8).join('\n')}`)
        .join('\n\n');

    const systemPrompt = `你是一名阿联酋汽车市场情报编辑，请根据输入的已分类新闻生成一份中文日报。

目标：
1. 只基于输入内容，不补充外部事实。
2. 输出简洁、可读、适合业务团队晨报。
3. 只写事实，不写“建议”“影响判断”“行动项”。

输出格式要求：
- 第一行固定为：## 阿联酋汽车市场日报
- 第二行固定为：**覆盖时间：${dateRange}**
- 后续按有内容的类别输出小节。
- 小节标题沿用输入中的类型名称。
- 每条新闻写成一行短句，保留品牌名。
- 全文使用中文。
- 不要输出 JSON，不要输出代码块，不要添加额外前言或结尾。`;

    const { response, data } = await callQwen(
        apiKey,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请整理以下新闻：\n\n${groupedText}` },
        ],
        0.2,
    );

    if (!response.ok) {
        throw new Error(data.message || 'Failed to generate digest');
    }

    const digest = data.output?.choices?.[0]?.message?.content || '';
    return res.status(200).json({ success: true, digest });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-xxxx')) {
        return res.status(503).json({ error: 'DASHSCOPE_API_KEY is not configured' });
    }

    const action = req.query.action || '';

    try {
        if (action === 'analyze') return await handleAnalyze(req, res, apiKey);
        if (action === 'digest') return await handleDigest(req, res, apiKey);
        return res.status(400).json({ error: 'Missing query param: action=analyze|digest' });
    } catch (error) {
        console.error('[/api/ai]', error);
        if (error.name === 'AbortError') {
            return res.status(504).json({ error: 'AI request timed out after 60 seconds' });
        }
        return res.status(500).json({ error: error.message });
    }
}
