/**
 * /api/data.js  ─  merged data storage handler
 *
 * Routes:
 *   GET/POST /api/data?type=news    → formerly /api/news
 *   GET/POST /api/data?type=brands  → formerly /api/brands
 */
import { put, list } from '@vercel/blob';

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
};

async function handleBlob(req, res, filename) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
        if (req.method === 'GET') return res.status(200).json([]);
        return res.status(503).json({ error: 'Storage token missing' });
    }

    if (req.method === 'GET') {
        const { blobs } = await list({ token, limit: 100 });
        const blob = blobs.find(b => b.pathname === filename);
        if (!blob) return res.status(200).json([]);

        const response = await fetch(`${blob.url}?t=${Date.now()}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
        return res.status(200).json(await response.json());
    }

    if (req.method === 'POST') {
        let payload = req.body;
        if (typeof payload === 'string') {
            try { payload = JSON.parse(payload); }
            catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }
        }

        const saved = await put(filename, JSON.stringify(payload, null, 2), {
            access: 'public',
            token,
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: 'application/json',
            cacheControlMaxAge: 0,
        });

        return res.status(200).json({ success: true, url: saved.url, updatedAt: new Date().toISOString() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default async function handler(req, res) {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    if (req.method === 'OPTIONS') return res.status(200).end();

    const type = req.query.type || '';

    try {
        if (type === 'news') return await handleBlob(req, res, 'news.json');
        if (type === 'brands') return await handleBlob(req, res, 'brands.json');
        return res.status(400).json({ error: 'Missing query param: type=news|brands' });
    } catch (err) {
        console.error('[/api/data]', err);
        return res.status(500).json({ error: err.message });
    }
}
