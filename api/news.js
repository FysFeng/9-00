import { put, list } from '@vercel/blob';

// Remove 'runtime: edge' to use default Node.js runtime

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(503).json({ error: "Vercel Blob token not found" });
  }

  try {
    // ================= GET 请求 (读取) =================
    if (req.method === 'GET') {
      const { blobs } = await list({ token });
      const newsBlob = blobs.find(b => b.pathname === 'news.json');

      if (!newsBlob) {
        return res.status(200).json([]);
      }

      // 【关键修复 1】禁用缓存
      // 这里的 fetch 可能会读取到 CDN 的旧缓存，必须强制 'no-store'
      const dataRes = await fetch(newsBlob.url, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' } 
      });

      // 【关键修复 2】防止 JSON 解析崩溃
      // 如果文件损坏或为空，这里会报错，导致接口 500。我们需要捕获它。
      try {
        const textData = await dataRes.text(); // 先取文本，防止 .json() 直接崩
        const data = textData ? JSON.parse(textData) : [];
        return res.status(200).json(data);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        // 如果解析失败，返回空数组，而不是让页面崩溃
        return res.status(200).json([]); 
      }
    }

    // ================= POST 请求 (保存) =================
    if (req.method === 'POST') {
      let body = req.body;

      // 【关键修复 3】确保 body 被正确解析
      // 有时候客户端没发 Content-Type: application/json，body 可能是字符串
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error("Body parse error", e);
          return res.status(400).json({ error: "Invalid JSON body" });
        }
      }

      if (!body) {
        return res.status(400).json({ error: "No data provided" });
      }
      
      // Save/Overwrite 'news.json'
      await put('news.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false, // 覆盖旧文件
        token,
        // 添加 contentType 帮助浏览器正确识别
        contentType: 'application/json', 
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
