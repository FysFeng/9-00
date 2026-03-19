/**
 * /api/collect.js  ─  merged collection / delivery handler
 *
 * Routes (via ?action=...):
 *   GET  /api/collect?action=rss      → formerly /api/rss
 *   POST /api/collect?action=spider   → formerly /api/spider
 *   GET  /api/collect?action=pending  → formerly /api/pending (GET)
 *   DELETE /api/collect?action=pending → formerly /api/pending (DELETE)
 *   POST /api/collect?action=push     → formerly /api/push
 */

import * as cheerio from 'cheerio';
import { put, list, del } from '@vercel/blob';

// ── RSS / Nitter / Google News config ──────────────────────────────

// ── Tier 1: Dedicated UAE/GCC Auto Outlets ──────────────────────────
const FIXED_SOURCES = [
    // Auto-focused outlets
    { name: 'DriveArabia', url: 'https://www.drivearabia.com/news/feed/' },
    { name: 'YallaMotor UAE', url: 'https://uae.yallamotor.com/car-news/rss' },
    { name: 'Autocar Middle East', url: 'https://www.autocarme.com/rss' },

    // General UAE business/news that covers auto heavily
    { name: 'Gulf News Auto', url: 'https://gulfnews.com/rss/business/auto' },
    { name: 'Khaleej Times Auto', url: 'https://www.khaleejtimes.com/business/auto.xml' },
    { name: 'Arabian Business', url: 'https://www.arabianbusiness.com/rss' },
    { name: 'The National UAE', url: 'https://www.thenationalnews.com/rss/vehicle.xml' },

    // ── Tier 2: Government & Policy (UAE Official) ──────────────────
    // WAM - UAE state news agency, covers all government/policy announcements
    { name: 'WAM English', url: 'https://wam.ae/en/rss' },
    // RTA Dubai media center (press releases: EV targets, traffic regs, fleet policy)
    { name: 'RTA Dubai News', url: 'https://www.rta.ae/wps/content/connect/rta/site/en/news/all-news-feed' },
];

// ── Tier 3: Official Brand Accounts on X (via Nitter) ────────────────
// Only using accounts with meaningful regular activity; regional > global where available
const NITTER_INSTANCES = [
    'https://nitter.privacydev.net',
    'https://nitter.42l.fr',
    'https://nitter.cz',
];

const OFFICIAL_X_ACCOUNTS = [
    // Changan — primary focus brand
    { brand: 'Changan UAE', handle: 'ChanganAutoUAE' },
    { brand: 'Changan Global', handle: 'ChanganAutoGroup' },

    // Chinese challengers in UAE
    { brand: 'BYD UAE', handle: 'BYDAutoUAE' },
    { brand: 'MG UAE', handle: 'MGMotorUAE' },
    { brand: 'Geely UAE', handle: 'GeelyAutoME' },
    { brand: 'Chery UAE', handle: 'CheryAutoUAE' },
    { brand: 'GAC UAE', handle: 'GACMotorUAE' },
    { brand: 'GWM UAE', handle: 'GWMMotorUAE' },

    // Incumbent brands (market baseline / competitive pressure)
    { brand: 'Toyota UAE', handle: 'ToyotaUAE' },
    { brand: 'Nissan ME', handle: 'NissanMiddleEast' },
    { brand: 'Hyundai ME', handle: 'HyundaiME' },
    { brand: 'Kia UAE', handle: 'KiaUAE' },

    // UAE auto ecosystem
    { brand: 'Al-Futtaim Auto', handle: 'AlFuttaimGroup' },      // BYD, Toyota distrib.
    { brand: 'AW Rostamani', handle: 'AWRostamani' },            // Geely, Nissan
    { brand: 'DEWA', handle: 'DEWAOfficial' },                   // EV charging infrastructure
    { brand: 'RTA Dubai', handle: 'rta_dubai' },                 // Vehicle registration policy
];

// ── Tier 4: Google News Keyword Sweeps ───────────────────────────────
// Organized by strategic topic, not just brand name pairings
const GOOGLE_NEWS_KEYWORDS = [
    // === Changan in UAE ===
    'Changan car UAE launch',
    'Changan Uni UAE price',
    'Changan CS75 UAE',
    'Changan Lamore UAE',
    'Changan electric vehicle UAE',
    'Changan EV dealer UAE',

    // === Chinese challenger brands (direct competition) ===
    'BYD UAE dealer price 2025',
    'BYD Atto 3 UAE',
    'BYD Seal UAE price',
    'MG Motor UAE new model',
    'MG ZS EV UAE price',
    'Chery Tiggo UAE launch',
    'Omoda UAE price',
    'Jaecoo UAE launch',
    'Geely Monjaro UAE',
    'Zeekr UAE',
    'GAC Aion UAE electric',
    'Haval H6 UAE price',
    'Tank 300 UAE',
    'Jetour UAE launch',

    // === Incumbent Japanese/Korean brands (market pressure context) ===
    'Toyota RAV4 UAE discount',
    'Toyota Land Cruiser UAE 2025',
    'Nissan patrol UAE deal',
    'Hyundai Tucson UAE price',
    'Kia Sportage UAE offer',

    // === UAE Market-level data ===
    'UAE car sales figures 2025',
    'UAE automobile market growth',
    'Dubai Motor Show 2025',
    'Abu Dhabi auto market',
    'GCC car market share Chinese brands',
    'car price reduction UAE promotion',
    'zero percent finance car UAE',
    'used car market UAE 2025',

    // === EV & Infrastructure (directly affects market dynamics) ===
    'UAE electric vehicle sales target',
    'Dubai EV charging station DEWA',
    'UAE green vehicle incentive policy',
    'Abu Dhabi electric car subsidy',
    'UAE EV registration statistics',

    // === Government & Regulatory (RTA, MOEI, municipal) ===
    'RTA Dubai vehicle registration new rules',
    'UAE vehicle import regulation 2025',
    'UAE automotive policy ministry',
    'UAE fuel price October 2025',
    'Emirates vehicle inspection requirement',
];

const toNitterRSS = (handle, brand) => ({
    name: `X: @${handle} (${brand})`,
    url: `${NITTER_INSTANCES[Math.floor(Math.random() * NITTER_INSTANCES.length)]}/${handle}/rss`,
});

const toGoogleNewsRSS = (kw) => ({
    name: `GNews: ${kw}`,
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=en&gl=AE&ceid=AE:en`,
});

const ALL_SOURCES = [
    ...FIXED_SOURCES,
    ...OFFICIAL_X_ACCOUNTS.map(a => toNitterRSS(a.handle, a.brand)),
    ...GOOGLE_NEWS_KEYWORDS.map(toGoogleNewsRSS),
];


async function fetchSingleRSS(source, cutoffTime) {
    try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 9000);
        const response = await fetch(source.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)', Accept: 'application/rss+xml, */*' },
            signal: controller.signal,
        });
        clearTimeout(tid);
        if (!response.ok) return [];

        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const items = [];

        $('item').each((i, el) => {
            if (i >= 25) return;
            const pubTime = new Date($(el).find('pubDate').text().trim()).getTime();
            if (isNaN(pubTime) || pubTime < cutoffTime) return;

            const title = $(el).find('title').text().trim().replace(/\s*<!\[CDATA\[|\]\]>/g, '');
            const link = $(el).find('link').text().trim() || $(el).find('link').attr('href') || '';
            const desc = $(el).find('description').text().replace(/<[^>]*>?/gm, '').substring(0, 150).trim();

            if (title && link) items.push({ source: source.name, title, url: link, date: new Date(pubTime).toISOString().split('T')[0], rawDate: pubTime, snippet: desc });
        });

        return items;
    } catch {
        return [];
    }
}

// ── Handler implementations ────────────────────────────────────────
async function handleRSS(req, res) {
    const days = parseInt(req.query.days) || 7;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const results = await Promise.all(ALL_SOURCES.map(src => fetchSingleRSS(src, cutoffTime)));
    const seen = new Set();
    const allItems = results.flat().filter(item => {
        if (seen.has(item.title)) return false;
        seen.add(item.title);
        return true;
    }).sort((a, b) => b.rawDate - a.rawDate);
    return res.status(200).json({ success: true, timeRange: `${days}d`, count: allItems.length, items: allItems });
}

async function handleSpider(req, res) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({ error: 'Token missing' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    let html = '';
    try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: controller.signal });
        clearTimeout(tid);
        if (!r.ok) throw new Error(`Target refused: ${r.status}`);
        html = await r.text();
    } catch (e) {
        clearTimeout(tid);
        throw new Error(e.name === 'AbortError' ? 'Timeout: Site too slow' : e.message);
    }

    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, iframe, svg, form, .ads, .comment, noscript').remove();

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || 'Untitled';
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    let bodyText = '';
    $('p').each((_, el) => { const t = $(el).text().trim(); if (t.length > 20) bodyText += t + '\n'; });
    if (bodyText.length < 50) {
        bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        if (bodyText.length < 50) throw new Error('Content too short (SPA or Anti-bot)');
    }

    const id = Math.random().toString(36).substring(2, 10);
    const item = { id, url, title, summary: metaDesc.substring(0, 200) || bodyText.substring(0, 150) + '...', text: bodyText.substring(0, 3000), scrapedAt: new Date().toISOString().split('T')[0], source: new URL(url).hostname.replace('www.', '') };
    await put(`pending/${id}.json`, JSON.stringify(item), { access: 'public', addRandomSuffix: false, allowOverwrite: true, token, contentType: 'application/json', cacheControlMaxAge: 0 });
    return res.status(200).json({ success: true, item });
}

async function handlePending(req, res) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({ error: 'Token missing' });

    if (req.method === 'GET') {
        const { blobs } = await list({ token, prefix: 'pending/', limit: 50 });
        if (!blobs.length) return res.status(200).json([]);
        const results = await Promise.all(blobs.map(async b => {
            try { const r = await fetch(b.url, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; }
        }));
        return res.status(200).json(results.filter(Boolean).sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt)));
    }

    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Missing ID' });
        await del(`pending/${id}.json`, { token });
        return res.status(200).json({ success: true });
    }

    return res.status(405).end();
}

async function handlePush(req, res) {
    const { digest, webhookUrl, type = 'wechat' } = req.body;
    if (!digest || !webhookUrl) return res.status(400).json({ error: '请提供简报内容和 Webhook URL' });

    let payload;
    if (type === 'wechat') payload = { msgtype: 'markdown', markdown: { content: digest } };
    else if (type === 'dingtalk') payload = { msgtype: 'markdown', markdown: { title: '今日市场简报', text: digest } };
    else if (type === 'lark') payload = { msg_type: 'interactive', card: { config: { wide_screen_mode: true }, elements: [{ tag: 'markdown', content: digest }] } };
    else return res.status(400).json({ error: '不支持的 Webhook 类型' });

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
    clearTimeout(tid);

    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data.errcode && data.errcode !== 0)) throw new Error(data.errmsg || 'Webhook 推送失败');

    return res.status(200).json({ success: true, message: '推送成功' });
}

// ── Main Handler ────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const action = req.query.action || '';

    try {
        if (action === 'rss') return await handleRSS(req, res);
        if (action === 'spider') return await handleSpider(req, res);
        if (action === 'pending') return await handlePending(req, res);
        if (action === 'push') return await handlePush(req, res);
        return res.status(400).json({ error: 'Missing query param: action=rss|spider|pending|push' });
    } catch (err) {
        console.error('[/api/collect]', err);
        if (err.name === 'AbortError') return res.status(504).json({ error: 'Request timed out' });
        return res.status(500).json({ error: err.message });
    }
}
