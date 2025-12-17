import { put, list } from '@vercel/blob';

// Remove 'runtime: edge' to use default Node.js runtime

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    if (req.method === 'GET') {
        return res.status(200).json([]);
    }
    return res.status(503).json({ error: "Vercel Blob token not found" });
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token });
      const brandsBlob = blobs.find(b => b.pathname === 'brands.json');

      if (!brandsBlob) {
        return res.status(200).json([]);
      }

      const dataRes = await fetch(brandsBlob.url);
      const data = await dataRes.json();

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body;
      
      await put('brands.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        token
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
