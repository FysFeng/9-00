import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "未配置 Blob Token" });

  try {
    // GET: 列出所有待处理文件并聚合
    if (req.method === 'GET') {
        // 1. 列出 pending/ 目录下的所有文件
        const { blobs } = await list({ 
            token, 
            prefix: 'pending/', 
            limit: 50 // 限制每次只取最新的50条，防止请求过多
        });

        if (blobs.length === 0) return res.status(200).json([]);

        // 2. 并行获取所有文件的内容 (聚合)
        // Vercel Blob 的 list 只返回元数据，不返回内容。我们需要内容来展示标题。
        // 由于每个文件很小 (<5KB)，并行 fetch 速度很快。
        const fetchPromises = blobs.map(async (blob) => {
            try {
                const res = await fetch(blob.url, { cache: 'no-store' });
                if (res.ok) return await res.json();
                return null;
            } catch (e) {
                return null;
            }
        });

        const results = await Promise.all(fetchPromises);
        
        // 过滤掉无效数据并按时间倒序 (文件名 id 不一定有序，这里最好前端排序，或者依靠 scrapedAt)
        const validItems = results
            .filter(item => item !== null)
            .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt));

        return res.status(200).json(validItems);
    }

    // DELETE: 删除特定文件
    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Missing ID" });

        // 直接删除对应的 Blob 文件，不需要读取列表 -> 过滤 -> 写入大文件
        // 这是一个原子操作，非常快且省流量
        await del(`pending/${id}.json`, { token });

        return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error("Pending API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
