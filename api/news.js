import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  // 1. 基础安全与跨域设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate'); // 强缓存控制
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    if (req.method === 'GET') return res.status(200).json([]); // 容错：无 Token 时返回空数组
    return res.status(503).json({ error: "Storage token missing" });
  }

  try {
    // --- 处理 GET 请求：读取数据 ---
    if (req.method === 'GET') {
      const { blobs } = await list({ token, limit: 100 });
      const newsBlob = blobs.find(b => b.pathname === 'news.json');

      if (!newsBlob) return res.status(200).json([]);

      // 加上时间戳绕过 Edge CDN 缓存
      const response = await fetch(`${newsBlob.url}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) throw new Error("Failed to fetch blob content");

      const data = await response.json();
      return res.status(200).json(data);
    }

    // --- 处理 POST 请求：保存/覆盖数据 ---
    if (req.method === 'POST') {
      let payload = req.body;
      
      // 兼容字符串或对象格式
      if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }
      }

      // 写入 Blob (Vercel Blob v2.0 标准语法)
      const blob = await put('news.json', JSON.stringify(payload, null, 2), {
        access: 'public',
        token,
        addRandomSuffix: false, // 保持文件名固定为 news.json
        allowOverwrite: true,   // 关键：允许覆盖已存在的文件
        contentType: 'application/json',
        cacheControlMaxAge: 0   // 确保存储层不产生长缓存
      });

      return res.status(200).json({ 
        success: true, 
        url: blob.url,
        updatedAt: new Date().toISOString() 
      });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error("Critical Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
