import { put, list } from '@vercel/blob';

// Node.js Runtime
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0'); // Prevent API response caching

  // Handle preflight request
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
      // 1. List files to find 'news.json'
      // list() usually returns fresh metadata, but the 'url' inside points to the CDN
      const { blobs } = await list({ token, limit: 100 }); 
      const newsBlob = blobs.find(b => b.pathname === 'news.json');

      if (!newsBlob) {
        return res.status(200).json([]);
      }

      // 2. Fetch the actual JSON content from the blob URL
      // ⚠️ CRITICAL FIX: Append timestamp to URL to bypass Vercel Edge Network Cache (CDN)
      // Vercel Blob public URLs are heavily cached.
      const noCacheUrl = `${newsBlob.url}?t=${Date.now()}`;
      
      const dataRes = await fetch(noCacheUrl, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' } 
      });

      if (!dataRes.ok) {
        throw new Error(`Failed to fetch blob content: ${dataRes.status}`);
      }
      
      const data = await dataRes.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let body = req.body;
      
      // Robust Parsing: Sometimes req.body might be a string depending on headers
      if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }
      }

      // Save/Overwrite 'news.json'
      // addRandomSuffix: false ensures we keep the same filename like a database
      await put('news.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        token,
        contentType: 'application/json', // Explicitly set content type
        cacheControlMaxAge: 0 // Suggest CDN to not cache this, though 'put' options support varies
      });

      return res.status(200).json({ success: true, timestamp: Date.now() });
    }

    return res.status(405).end();

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
