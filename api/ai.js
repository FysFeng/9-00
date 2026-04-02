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

    const systemPrompt = `你是一名阿联酋汽车市场情报编辑，请基于输入新闻生成一份自然、简洁、可直接转发的中文简报。

要求：
1. 只能基于输入内容，不补充外部事实，不做建议，不做因果推断。
2. 全文使用自然中文，不要保留英文分类标题，不要写成技术说明书。
3. 输出结构固定为：
# 阿联酋汽车市场简报
覆盖时间：${dateRange}

一、今日要点
- 用2到4条总结最值得关注的变化，每条一句话。

二、分类动态
- 按输入中存在内容的类别输出小标题，标题必须是中文，例如“市场与销量”“新车发布”“竞品策略”。
- 每个小标题下写2到4条短句，保留品牌名和关键信息。

三、一句话观察
- 用1到2句话做中性总结，只总结市场发生了什么，不写建议。

额外规则：
- 不要输出 Markdown 三级标题，不要出现“### Market & Sales”这类英文标题。
- 不要直接照搬输入分类名，必须转成自然中文。
- 每条尽量短，读起来像晨报，不像数据库导出。
- 不要输出 JSON，不要输出代码块。`;

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
