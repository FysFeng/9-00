import { put } from '@vercel/blob';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "服务器配置错误: 未配置 Blob Token" });

  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL 不能为空" });

    // 1. 抓取网页 (15秒超时控制)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let html = '';
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`目标网站拒绝连接: ${response.status}`);
        html = await response.text();
    } catch (fetchError) {
        clearTimeout(timeoutId);
        throw new Error(fetchError.name === 'AbortError' ? "抓取超时: 网站响应过慢" : fetchError.message);
    }

    // 2. 使用 Cheerio 清洗内容 (比正则更智能、更精准)
    const $ = cheerio.load(html);

    // 移除干扰元素 (导航、广告、脚本)
    $('script, style, nav, footer, header, iframe, svg, form, .ads, .comment, .sidebar, noscript').remove();

    // 提取元数据
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '未命名文档';
    
    // 提取摘要 (优先用 meta description，作为人工初筛的依据)
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    // 提取正文 (只取 p 标签，保证语义连贯)
    let bodyText = '';
    $('p').each((i, el) => {
        const pText = $(el).text().trim();
        // 过滤掉太短的废话(如 "Read more", "Share")
        if (pText.length > 20) { 
            bodyText += pText + '\n';
        }
    });

    // 兜底策略：如果 p 标签提取太少，尝试提取 body 纯文本
    if (bodyText.length < 50) {
        bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        if (bodyText.length < 50) throw new Error("正文内容过短，可能是动态渲染网页 (SPA) 或反爬虫限制");
    }

    // 截取适量长度供 AI 分析 (3000字通常足够，节省存储)
    const cleanText = bodyText.substring(0, 3000);
    const summary = metaDesc ? metaDesc.substring(0, 200) : cleanText.substring(0, 150) + '...';

    // 3. 构造数据对象
    const id = Math.random().toString(36).substring(2, 10);
    const newItem = {
        id,
        url,
        title,
        summary, // 用于前端列表预览
        text: cleanText, // 用于发给 AI
        scrapedAt: new Date().toISOString().split('T')[0],
        source: new URL(url).hostname.replace('www.', '')
    };

    // 4. 存储优化: 分散存储 (Pending Box)
    // 写入 pending/{id}.json，避免读取和写入巨大的 pending.json
    await put(`pending/${id}.json`, JSON.stringify(newItem), {
        access: 'public',
        addRandomSuffix: false, // 确定性文件名
        allowOverwrite: true,
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 0 // 不缓存
    });

    return res.status(200).json({ success: true, item: newItem });

  } catch (error) {
    console.error("Spider Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
