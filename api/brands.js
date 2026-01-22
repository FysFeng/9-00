import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    if (req.method === 'GET') return res.status(200).json([]);
    return res.status(503).json({ error: "Storage token missing" });
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token, limit: 100 });
      const brandsBlob = blobs.find(b => b.pathname === 'brands.json');

      if (!brandsBlob) return res.status(200).json([]);

      const response = await fetch(`${brandsBlob.url}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) throw new Error("Failed to fetch brands blob");

      const data = await response.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let payload = req.body;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch (e) { return res.status(400).json({ error: "Invalid JSON" }); }
      }
      
      // FIX: Apply allowOverwrite: true here as well
      await put('brands.json', JSON.stringify(payload, null, 2), {
        access: 'public',
        token,
        addRandomSuffix: false,
        allowOverwrite: true, 
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error("Brands Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
