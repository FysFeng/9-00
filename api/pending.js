type: uploaded file
fileName: api/pending.js
fullContent:
import { put, list } from '@vercel/blob';

// 这是一个专门用于存储 "待处理情报" (Pending Items) 的接口
// 逻辑与 news.js 类似，但操作的是 pending.json 文件

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "Vercel Blob token missing" });

  try {
    // GET: 获取所有待处理项
    if (req.method === 'GET') {
      const { blobs } = await list({ token, limit: 100 });
      const blob = blobs.find(b => b.pathname === 'pending.json');
      
      if (!blob) return res.status(200).json([]);

      const dataRes = await fetch(`${blob.url}?t=${Date.now()}`);
      if (!dataRes.ok) return res.status(200).json([]);
      
      const data = await dataRes.json();
      return res.status(200).json(data);
    }

    // POST: 更新整个列表 (新增或删除都通过覆盖实现，简化逻辑)
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);

      await put('pending.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        addOverwrite: true,
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();

  } catch (error) {
    console.error("Pending Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
