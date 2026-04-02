/**
 * /api/ai.js
 *
 * Routes:
 *   POST /api/ai?action=analyze
 *   POST /api/ai?action=digest
 */

const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

function extractJsonObject(rawContent) {
    const cleaned = String(rawContent || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstOpen = cleaned.indexOf('{');
    const lastClose = cleaned.lastIndexOf('}');
    return firstOpen !== -1 && lastClose !== -1 ? cleaned.slice(firstOpen, lastClose + 1) : cleaned;
}

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
        grouped[type].push(`- [${item.brand || '市场'}] ${item.title}`);
    });

    const groupedText = Object.entries(grouped)
        .map(([type, lines]) => `## ${typeLabels[type] || type}\n${lines.slice(0, 8).join('\n')}`)
        .join('\n\n');

    const systemPrompt = `你是一名阿联酋汽车市场资讯整理助手。
请基于输入新闻，输出严格 JSON，用于生成“中文分组清单”。

任务目标：
1. 只做整理和重写，不做分析，不做总结，不做结论。
2. 每条输入新闻最多对应一条清单内容。
3. 输出内容必须完全基于输入，不得补充外部事实，不得推断品牌机会、市场接受度、竞争影响或战略意义。
4. 如果输入里没有提到某个品牌，就绝对不要新增提到该品牌。
5. 特别禁止生成类似“成本优势显著推动某品牌接受度提升”“对某品牌形成机会”这种推断句。

输出 JSON 结构：
{
  "sections": [
    {
      "title": "新车发布",
      "items": [
        "品牌A发布了某车型，重点信息是……",
        "品牌B推出了……"
      ]
    }
  ]
}

规则：
1. title 必须是自然中文分组名，例如“新车发布”“市场与销量”“技术与配置”“竞品策略”“政策与监管”“渠道与服务”“企业动向”“其他动态”。
2. items 里的每一条都必须是一句简洁中文，只罗列新闻事实。
3. 可以合并同一条新闻中的短信息，但不能把多条新闻混写成一句判断。
4. 不要输出 markdown，不要输出代码块，不要输出 JSON 之外的任何内容。`;

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

    const rawContent = data.output?.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(extractJsonObject(rawContent));
    const sections = Array.isArray(parsed.sections) ? parsed.sections : [];

    const lines = [
        '# 阿联酋汽车市场简报',
        `覆盖时间：${dateRange}`,
        '',
    ];

    sections.forEach((section) => {
        const title = typeof section?.title === 'string' ? section.title.trim() : '';
        const items = Array.isArray(section?.items)
            ? section.items.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
            : [];

        if (!title || items.length === 0) return;

        lines.push(title);
        items.forEach((item, index) => {
            lines.push(`${index + 1}. ${item}`);
        });
        lines.push('');
    });

    const digest = lines.join('\n').trim();
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
