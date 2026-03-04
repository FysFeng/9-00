/**
 * /api/push.js
 * 接收简报内容并推送到企业微信/钉钉/自定义 Webhook
 * POST { digest: string, webhookUrl: string, type: 'wechat' | 'dingtalk' | 'lark' }
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { digest, webhookUrl, type = 'wechat' } = req.body;

    if (!digest || !webhookUrl) {
        return res.status(400).json({ error: '请提供简报内容和 Webhook URL' });
    }

    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 10000);

        let payload;

        // 根据不同平台的 Webhook 格式构造 Payload
        if (type === 'wechat') {
            payload = {
                msgtype: 'markdown',
                markdown: { content: digest }
            };
        } else if (type === 'dingtalk') {
            payload = {
                msgtype: 'markdown',
                markdown: { title: '今日市场简报', text: digest }
            };
        } else if (type === 'lark') { // 飞书
            // 飞书 markdown 需要特定的格式，这里简单处理
            payload = {
                msg_type: 'interactive',
                card: {
                    config: { wide_screen_mode: true },
                    elements: [{ tag: 'markdown', content: digest }]
                }
            };
        } else {
            return res.status(400).json({ error: '不支持的 Webhook 类型' });
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(tid);

        const data = await response.json().catch(() => ({}));

        // 企业微信一般返回 errcode: 0 表示成功
        if (!response.ok || (data.errcode && data.errcode !== 0)) {
            throw new Error(data.errmsg || 'Webhook 推送失败');
        }

        return res.status(200).json({ success: true, message: '推送成功' });

    } catch (err) {
        console.error('Push Error:', err);
        if (err.name === 'AbortError') {
            return res.status(504).json({ error: '推送超时，请检查 Webhook 地址' });
        }
        return res.status(500).json({ error: err.message });
    }
}
