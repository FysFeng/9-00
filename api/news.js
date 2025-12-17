import { put, list } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Check if Blob is configured
  if (!token) {
    if (req.method === 'GET') {
        // Return empty array gracefully if not configured, to allow UI demo to work
        return new Response(JSON.stringify([]), { status: 200, headers: {'Content-Type': 'application/json'} });
    }
    return new Response(JSON.stringify({ error: "Vercel Blob token not found" }), { status: 503 });
  }

  try {
    if (req.method === 'GET') {
      // List files to find 'news.json'
      const { blobs } = await list({ token });
      const newsBlob = blobs.find(b => b.pathname === 'news.json');

      if (!newsBlob) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Fetch the actual JSON content from the blob URL
      const dataRes = await fetch(newsBlob.url);
      const data = await dataRes.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Save/Overwrite 'news.json'
      // addRandomSuffix: false ensures we keep the same filename like a database
      await put('news.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        token
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response("Method not allowed", { status: 405 });

  } catch (error) {
    console.error("Blob Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}