import { put, list } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
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

  if (!token) {
    if (req.method === 'GET') {
        return new Response(JSON.stringify([]), { status: 200, headers: {'Content-Type': 'application/json'} });
    }
    return new Response(JSON.stringify({ error: "Vercel Blob token not found" }), { status: 503 });
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token });
      const brandsBlob = blobs.find(b => b.pathname === 'brands.json');

      if (!brandsBlob) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const dataRes = await fetch(brandsBlob.url);
      const data = await dataRes.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      await put('brands.json', JSON.stringify(body), {
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}