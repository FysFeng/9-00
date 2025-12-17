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

  // Check if Blob is configured
  if (!token) {
    if (req.method === 'GET') {
        // Return empty array gracefully if not configured
        return res.status(200).json([]);
    }
    return res.status(503).json({ error: "Vercel Blob token not found" });
  }

  try {
    if (req.method === 'GET') {
      // List files to find 'news.json'
      const { blobs } = await list({ token });
      const newsBlob = blobs.find(b => b.pathname === 'news.json');

      if (!newsBlob) {
        return res.status(200).json([]);
      }

      // Fetch the actual JSON content from the blob URL
      // Node.js 18+ supports global fetch
      const dataRes = await fetch(newsBlob.url);
      const data = await dataRes.json();

      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // In Vercel Node.js functions, req.body is already parsed if content-type is json
      const body = req.body;
      
      // Save/Overwrite 'news.json'
      await put('news.json', JSON.stringify(body), {
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
