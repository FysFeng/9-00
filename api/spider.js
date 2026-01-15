import { put } from '@vercel/blob';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "Server Config Error: Token Missing" });

  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    // 1. Fetch Page
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
        if (!response.ok) throw new Error(`Target refused connection: ${response.status}`);
        html = await response.text();
    } catch (fetchError) {
        clearTimeout(timeoutId);
        throw new Error(fetchError.name === 'AbortError' ? "Timeout: Site too slow" : fetchError.message);
    }

    // 2. Parse Content
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, iframe, svg, form, .ads, .comment, .sidebar, noscript').remove();

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || 'Untitled';
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    let bodyText = '';
    $('p').each((i, el) => {
        const pText = $(el).text().trim();
        if (pText.length > 20) bodyText += pText + '\n';
    });

    if (bodyText.length < 50) {
        bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        if (bodyText.length < 50) throw new Error("Content too short (SPA or Anti-bot)");
    }

    const cleanText = bodyText.substring(0, 3000);
    const summary = metaDesc ? metaDesc.substring(0, 200) : cleanText.substring(0, 150) + '...';

    const id = Math.random().toString(36).substring(2, 10);
    const newItem = {
        id,
        url,
        title,
        summary,
        text: cleanText,
        scrapedAt: new Date().toISOString().split('T')[0],
        source: new URL(url).hostname.replace('www.', '')
    };

    // 3. Save to Blob
    // FIX: Apply allowOverwrite: true here as well
    await put(`pending/${id}.json`, JSON.stringify(newItem), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true, 
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 0
    });

    return res.status(200).json({ success: true, item: newItem });

  } catch (error) {
    console.error("Spider Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
