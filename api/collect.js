/**
 * /api/collect.js
 *
 * Routes (via ?action=...):
 *   GET    /api/collect?action=rss
 *   POST   /api/collect?action=spider
 *   GET    /api/collect?action=pending
 *   DELETE /api/collect?action=pending
 *   POST   /api/collect?action=push
 */

import * as cheerio from 'cheerio';
import { put, list, del } from '@vercel/blob';

const FIXED_SOURCES = [
    { name: 'DriveArabia', url: 'https://www.drivearabia.com/news/feed/' },
    { name: 'AutoDrift UAE', url: 'https://autodrift.ae/feed' },
    { name: 'Autocar Middle East', url: 'https://www.autocarme.com/rss' },
    { name: 'WAM English', url: 'https://wam.ae/en/rss' },
    { name: 'RTA Dubai News', url: 'https://www.rta.ae/wps/content/connect/rta/site/en/news/all-news-feed' },
];

const NITTER_INSTANCES = [
    'https://nitter.privacydev.net',
    'https://nitter.42l.fr',
    'https://nitter.cz',
];

const OFFICIAL_X_ACCOUNTS = [
    { brand: 'Changan UAE', handle: 'ChanganAutoUAE' },
    { brand: 'Changan Global', handle: 'ChanganAutoGroup' },
    { brand: 'BYD UAE', handle: 'BYDAutoUAE' },
    { brand: 'MG UAE', handle: 'MGMotorUAE' },
    { brand: 'Geely UAE', handle: 'GeelyAutoME' },
    { brand: 'Chery UAE', handle: 'CheryAutoUAE' },
    { brand: 'GAC UAE', handle: 'GACMotorUAE' },
    { brand: 'GWM UAE', handle: 'GWMMotorUAE' },
    { brand: 'Toyota UAE', handle: 'ToyotaUAE' },
    { brand: 'Nissan ME', handle: 'NissanMiddleEast' },
    { brand: 'Hyundai ME', handle: 'HyundaiME' },
    { brand: 'Kia UAE', handle: 'KiaUAE' },
    { brand: 'Al-Futtaim Auto', handle: 'AlFuttaimGroup' },
    { brand: 'AW Rostamani', handle: 'AWRostamani' },
    { brand: 'DEWA', handle: 'DEWAOfficial' },
    { brand: 'RTA Dubai', handle: 'rta_dubai' },
];

const GOOGLE_NEWS_KEYWORDS = [
    'site:yallamotor.com UAE car news',
    'site:yallamotor.com new car launch UAE',
    'site:gulfnews.com UAE auto market',
    'site:khaleejtimes.com UAE car launch',
    'site:arabianbusiness.com UAE electric vehicle',
    'site:thenationalnews.com UAE vehicle market',
    'site:wam.ae UAE electric vehicle policy',
    'site:rta.ae Dubai vehicle registration policy',
    'Changan Uni UAE price',
    'Changan CS75 UAE',
    'Changan Lamore UAE',
    'Changan electric vehicle UAE',
    'Changan EV dealer UAE',
    'BYD UAE dealer price',
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
    'Toyota RAV4 UAE discount',
    'Toyota Land Cruiser UAE',
    'Nissan patrol UAE deal',
    'Hyundai Tucson UAE price',
    'Kia Sportage UAE offer',
    'UAE car sales figures',
    'UAE automobile market growth',
    'Dubai Motor Show',
    'Abu Dhabi auto market',
    'GCC car market share Chinese brands',
    'car price reduction UAE promotion',
    'zero percent finance car UAE',
    'used car market UAE',
    'UAE electric vehicle sales target',
    'Dubai EV charging station DEWA',
    'UAE green vehicle incentive policy',
    'Abu Dhabi electric car subsidy',
    'UAE EV registration statistics',
    'RTA Dubai vehicle registration new rules',
    'UAE vehicle import regulation',
    'UAE automotive policy ministry',
    'UAE fuel price',
    'Emirates vehicle inspection requirement',
];

const toGoogleNewsRSS = (keyword) => ({
    name: `GNews: ${keyword}`,
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en&gl=AE&ceid=AE:en`,
});

const toNitterRSS = (handle, brand, instanceIndex = 0) => ({
    name: `X: @${handle} (${brand}) [${instanceIndex + 1}]`,
    url: `${NITTER_INSTANCES[instanceIndex]}/${handle}/rss`,
});

const ALL_SOURCES = [
    ...FIXED_SOURCES,
    ...OFFICIAL_X_ACCOUNTS.flatMap((account) => NITTER_INSTANCES.map((_, index) => toNitterRSS(account.handle, account.brand, index))),
    ...GOOGLE_NEWS_KEYWORDS.map(toGoogleNewsRSS),
];

function extractFeedItems(source, xml, cutoffTime, maxItems = 25) {
    const $ = cheerio.load(xml, { xmlMode: true });
    const itemNodes = $('item').toArray();
    const entryNodes = itemNodes.length > 0 ? itemNodes : $('entry').toArray();
    const items = [];

    for (const el of entryNodes) {
        if (items.length >= maxItems) break;

        const node = $(el);
        const rawDateText =
            node.find('pubDate').first().text().trim()
            || node.find('published').first().text().trim()
            || node.find('updated').first().text().trim()
            || node.find('dc\\:date').first().text().trim()
            || node.find('date').first().text().trim();
        const pubTime = rawDateText ? new Date(rawDateText).getTime() : Date.now();
        if (rawDateText && (Number.isNaN(pubTime) || pubTime < cutoffTime)) continue;

        const title = node.find('title').first().text().trim().replace(/\s*<!\[CDATA\[|\]\]>/g, '');
        const atomLink = node.find('link[href]').filter((_, linkEl) => {
            const rel = $(linkEl).attr('rel');
            return !rel || rel === 'alternate';
        }).first().attr('href');
        const link =
            node.find('link').first().text().trim()
            || atomLink
            || node.find('id').first().text().trim()
            || '';
        const snippetSource =
            node.find('description').first().text()
            || node.find('summary').first().text()
            || node.find('content').first().text()
            || node.find('content\\:encoded').first().text()
            || '';
        const snippet = snippetSource.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim().substring(0, 180);

        if (!title || !link) continue;

        items.push({
            source: source.name,
            title,
            url: link,
            date: new Date(pubTime).toISOString().split('T')[0],
            rawDate: pubTime,
            snippet,
        });
    }

    return items;
}

async function collectSingleSource(source, cutoffTime) {
    const startedAt = Date.now();

    try {
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
                Accept: 'application/rss+xml, application/atom+xml, text/xml, application/xml, */*',
            },
            signal: controller.signal,
            redirect: 'follow',
        });
        clearTimeout(timerId);

        if (!response.ok) {
            return {
                source: source.name,
                url: source.url,
                ok: false,
                status: response.status,
                reason: `HTTP ${response.status}`,
                count: 0,
                durationMs: Date.now() - startedAt,
                items: [],
            };
        }

        const xml = await response.text();
        if (!/<(rss|feed|rdf:RDF)\b/i.test(xml)) {
            return {
                source: source.name,
                url: source.url,
                ok: false,
                status: response.status,
                reason: 'Non-feed response',
                count: 0,
                durationMs: Date.now() - startedAt,
                items: [],
            };
        }

        const items = extractFeedItems(source, xml, cutoffTime, 25);
        return {
            source: source.name,
            url: source.url,
            ok: true,
            status: response.status,
            reason: items.length > 0 ? 'ok' : 'no_recent_items',
            count: items.length,
            durationMs: Date.now() - startedAt,
            items,
        };
    } catch (error) {
        return {
            source: source.name,
            url: source.url,
            ok: false,
            status: 0,
            reason: error?.name === 'AbortError' ? 'timeout' : (error?.message || 'fetch_failed'),
            count: 0,
            durationMs: Date.now() - startedAt,
            items: [],
        };
    }
}

async function handleRSS(req, res) {
    const days = parseInt(req.query.days, 10) || 3;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const diagnostics = await Promise.all(ALL_SOURCES.map((source) => collectSingleSource(source, cutoffTime)));

    const seen = new Set();
    const items = diagnostics
        .flatMap((result) => result.items)
        .filter((item) => {
            const dedupeKey = `${item.title}::${item.url}`;
            if (seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        })
        .sort((a, b) => b.rawDate - a.rawDate);

    return res.status(200).json({
        success: true,
        timeRange: `${days}d`,
        count: items.length,
        items,
        sources: diagnostics.map(({ items: _items, ...meta }) => meta),
    });
}

async function handleSpider(req, res) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({ error: 'Token missing' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 15000);
    let html = '';

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal,
        });
        clearTimeout(timerId);
        if (!response.ok) throw new Error(`Target refused: ${response.status}`);
        html = await response.text();
    } catch (error) {
        clearTimeout(timerId);
        throw new Error(error.name === 'AbortError' ? 'Timeout: Site too slow' : error.message);
    }

    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, iframe, svg, form, .ads, .comment, noscript').remove();

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || 'Untitled';
    const metaDesc =
        $('meta[name="description"]').attr('content')
        || $('meta[property="og:description"]').attr('content')
        || '';
    let bodyText = '';
    $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) bodyText += `${text}\n`;
    });

    if (bodyText.length < 50) {
        bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        if (bodyText.length < 50) throw new Error('Content too short (SPA or anti-bot)');
    }

    const id = Math.random().toString(36).substring(2, 10);
    const item = {
        id,
        url,
        title,
        summary: metaDesc.substring(0, 200) || `${bodyText.substring(0, 150)}...`,
        text: bodyText.substring(0, 3000),
        scrapedAt: new Date().toISOString().split('T')[0],
        source: new URL(url).hostname.replace('www.', ''),
    };

    await put(`pending/${id}.json`, JSON.stringify(item), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 0,
    });

    return res.status(200).json({ success: true, item });
}

async function handlePending(req, res) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return res.status(503).json({ error: 'Token missing' });

    if (req.method === 'GET') {
        const { blobs } = await list({ token, prefix: 'pending/', limit: 50 });
        if (!blobs.length) return res.status(200).json([]);

        const results = await Promise.all(
            blobs.map(async (blob) => {
                try {
                    const response = await fetch(blob.url, { cache: 'no-store' });
                    return response.ok ? await response.json() : null;
                } catch {
                    return null;
                }
            }),
        );

        return res.status(200).json(
            results
                .filter(Boolean)
                .sort((a, b) => new Date(b.scrapedAt) - new Date(a.scrapedAt)),
        );
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
    if (!digest || !webhookUrl) {
        return res.status(400).json({ error: 'digest and webhookUrl are required' });
    }

    let payload;
    if (type === 'wechat') payload = { msgtype: 'markdown', markdown: { content: digest } };
    else if (type === 'dingtalk') payload = { msgtype: 'markdown', markdown: { title: 'Daily Digest', text: digest } };
    else if (type === 'lark') payload = { msg_type: 'interactive', card: { config: { wide_screen_mode: true }, elements: [{ tag: 'markdown', content: digest }] } };
    else return res.status(400).json({ error: 'Unsupported webhook type' });

    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
    });
    clearTimeout(timerId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok || (data.errcode && data.errcode !== 0)) {
        throw new Error(data.errmsg || 'Webhook push failed');
    }

    return res.status(200).json({ success: true, message: 'Push succeeded' });
}

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
    } catch (error) {
        console.error('[/api/collect]', error);
        if (error.name === 'AbortError') return res.status(504).json({ error: 'Request timed out' });
        return res.status(500).json({ error: error.message });
    }
}
