/**
 * /api/digest.js
 * 接收前端已筛选好的资讯列表，调用 Qwen 生成每日简报。
 * POST { items: NewsItem[] } → { digest: string }
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
        return res.status(503).json({ error: '未配置 DASHSCOPE_API_KEY 环境变量' });
    }

    const { items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: '请传入至少一条资讯' });
    }

    // 构建给 Qwen 的资讯列表文本（最多取 30 条避免 token 超限）
    const newsText = items
        .slice(0, 30)
        .map((item, i) => `${i + 1}. [${item.brand || '市场'}] ${item.title} (${item.date})`)
        .join('\n');

    const systemPrompt = `你是长安汽车阿联酋销售团队的市场分析助手。
根据以下今日收集的市场资讯，用中文生成一份简洁的每日简报。

简报格式：
## 今日市场简报 · ${new Date().toISOString().split('T')[0]}

**核心预警**（1-2 条最重要的竞品动向，如有）

**长安相关**（长安品牌的新动态，如有）

**竞品动态**（其他品牌的关键动作，3 条以内）

**大盘背景**（UAE 市场整体动向，1-2 句话）

---
要求：
- 每条不超过 40 字，语言客观专业，不浮夸
- 如果某个分类没有相关内容，跳过该分类
- 输出纯文本 Markdown，不要加多余的说明`;

    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(
            'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'qwen-plus',
                    input: {
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: `以下是今日资讯列表：\n${newsText}` },
                        ],
                    },
                    parameters: { result_format: 'message', temperature: 0.3 },
                }),
                signal: controller.signal,
            }
        );
        clearTimeout(tid);

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || '调用 Qwen 失败');

        const digest = data.output?.choices?.[0]?.message?.content || '';
        return res.status(200).json({ success: true, digest });

    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: '生成超时，请稍后重试' });
        }
        return res.status(500).json({ error: err.message });
    }
}
