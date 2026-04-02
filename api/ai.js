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
    const { items, startDate, endDate } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
    }

    const normalizedStartDate = typeof startDate === 'string' && startDate ? startDate : null;
    const normalizedEndDate = typeof endDate === 'string' && endDate ? endDate : null;

    const filteredItems = items.filter((item) => {
        if (normalizedStartDate && item.date < normalizedStartDate) return false;
        if (normalizedEndDate && item.date > normalizedEndDate) return false;
        return true;
    });

    if (filteredItems.length === 0) {
        return res.status(400).json({ error: 'No items found in the selected date range' });
    }

    const dates = filteredItems.map((item) => item.date).filter(Boolean).sort();
    const dateRange = normalizedStartDate && normalizedEndDate
        ? `${normalizedStartDate} 至 ${normalizedEndDate}`
        : dates.length > 0
            ? `${dates[0]} 至 ${dates[dates.length - 1]}`
            : new Date().toISOString().split('T')[0];

    const typeLabels = {
        'Launch (Physical)': '新车发布',
        'Tech & OTA': '技术与配置',
        'Market & Sales': '市场与销量',
        'Policy & Regulation': '政策与监管',
        'Network & Service': '渠道与服务',
        'Competitor Tactics': '竞品策略',
        'Corp & Strategy': '企业动向',
        Other: '其他动态',
    };

    const grouped = {};
    filteredItems.forEach((item) => {
        const type = item.type || 'Other';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(`- [${item.brand || '市场'}] ${item.title}：${item.summary || ''}`);
    });

    const groupedText = Object.entries(grouped)
        .map(([type, lines]) => `## ${typeLabels[type] || type}\n${lines.slice(0, 8).join('\n')}`)
        .join('\n\n');

    const systemPrompt = `你是一名阿联酋汽车市场资讯编辑。请把输入新闻整理成一份中文分组清单。

输出格式固定为：
# 阿联酋汽车市场简报
覆盖时间：${dateRange}

新车发布
1. ...
2. ...

市场与销量
1. ...

写作要求：
1. 这是一份“分组清单”，不是分析报告，也不是晨会评论。
2. 只做汇总和罗列，不写观察，不写结论，不写今日要点，不写建议。
3. 按输入中已有内容分组，分组标题必须使用自然中文，例如“新车发布”“市场与销量”“竞品策略”。
4. 每组下面使用阿拉伯数字编号，从 1 开始逐条罗列。
5. 每条只保留一条新闻的核心信息，写成一句简洁中文。
6. 保留品牌名、车型名、关键数字或动作，但不要扩写，不要推断。
7. 不要输出英文分类标题，不要出现“### Market & Sales”这种格式。
8. 不要输出“今日要点”“一句话观察”“总结”“结论”等任何额外板块。
9. 不要输出 JSON，不要输出代码块。`;

    const { response, data } = await callQwen(
        apiKey,
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请整理以下新闻：\n\n${groupedText}` },
        ],
        0.1,
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
