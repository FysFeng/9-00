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

const OFFICIAL_OFFER_SOURCES = [
    {
        name: 'Geely UAE Official Offers',
        brand: 'Geely 吉利',
        url: 'https://www.geely.ae/en',
        linkKeywords: ['offer', 'offers', 'special-offers', 'price', 'finance', 'promotion'],
    },
    {
        name: 'BYD UAE Official Offers',
        brand: 'BYD 比亚迪',
        url: 'https://www.byduae.ae/en/',
        linkKeywords: ['offer', 'offers', 'exclusive-offers', 'price', 'finance', 'promotion'],
    },
    {
        name: 'iCAUR UAE Official Offers',
        brand: 'Chery iCAUR',
        url: 'https://icauruae.com/',
        linkKeywords: ['offer', 'offers', 'price', 'finance', 'promotion'],
    },
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
    'site:byduae.ae/en BYD UAE offers price',
    'MG Motor UAE new model',
    'MG ZS EV UAE price',
    'Chery Tiggo UAE launch',
    'Omoda UAE price',
    'Jaecoo UAE launch',
    'site:icauruae.com iCAUR UAE offers price',
    'Geely Monjaro UAE',
    'site:geely.ae/en Geely UAE offers price',
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
    'UAE car market share Chinese brands',
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

function normalizeText(value = '') {
    return value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeUrl(rawUrl = '') {
    if (!rawUrl) return '';
    try {
        const parsed = new URL(rawUrl);
        parsed.hash = '';
        parsed.hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
        const blockedParams = new Set([
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'igshid', 'mc_cid', 'mc_eid', 'ref', 'ref_src',
        ]);
        [...parsed.searchParams.keys()].forEach((key) => {
            if (blockedParams.has(key.toLowerCase())) parsed.searchParams.delete(key);
        });
        parsed.pathname = parsed.pathname.replace(/\/+$/, '');
        parsed.search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : '';
        return parsed.toString();
    } catch {
        return rawUrl.trim();
    }
}

const UAE_PATTERNS = [
    /\buae\b/i,
    /\bunited arab emirates\b/i,
    /\bdubai\b/i,
    /\babu dhabi\b/i,
    /\bsharjah\b/i,
    /\bajman\b/i,
    /\bras al khaimah\b/i,
    /\bfujairah\b/i,
    /\bumm al quwain\b/i,
    /\baed\b/i,
];

const BRAND_PATTERNS = [
    /\bchangan\b/i,
    /\bdeepal\b/i,
    /\bavatr\b/i,
    /\bbyd\b/i,
    /\bdenza\b/i,
    /\bgeely\b/i,
    /\bzeekr\b/i,
    /\blink\s*&\s*co\b/i,
    /\bchery\b/i,
    /\bicaur\b/i,
    /\bexeed\b/i,
    /\bjaecoo\b/i,
    /\bomoda\b/i,
    /\bmg\b/i,
    /\bgwm\b/i,
    /\bhaval\b/i,
    /\btank\b/i,
    /\bjetour\b/i,
    /\bgac\b/i,
    /\baion\b/i,
    /\btoyota\b/i,
    /\bnissan\b/i,
    /\bhyundai\b/i,
    /\bkia\b/i,
    /\bhonda\b/i,
    /\blexus\b/i,
    /\bford\b/i,
    /\bchevrolet\b/i,
    /\bvolkswagen\b/i,
    /\bmercedes\b/i,
    /\bbmw\b/i,
    /\baudi\b/i,
    /\bland rover\b/i,
];

const AUTO_TOPIC_PATTERNS = [
    /\bauto(motive)?\b/i,
    /\bcar(s)?\b/i,
    /\bvehicle(s)?\b/i,
    /\bev(s)?\b/i,
    /\belectric vehicle(s)?\b/i,
    /\bhybrid\b/i,
    /\bsuv\b/i,
    /\bsedan\b/i,
    /\bdealer(ship)?\b/i,
    /\bshowroom\b/i,
    /\bservice center\b/i,
    /\bcharging\b/i,
];

const MARKET_SIGNAL_PATTERNS = [
    /\blaunch(ed|es)?\b/i,
    /\bprice(s|d)?\b/i,
    /\bdiscount(s|ed)?\b/i,
    /\boffer(s)?\b/i,
    /\bpromotion(s)?\b/i,
    /\bfinance\b/i,
    /\bzero percent\b/i,
    /\bwarranty\b/i,
    /\binsurance\b/i,
    /\btrade[- ]?in\b/i,
    /\bdelivery\b/i,
    /\bregistration\b/i,
    /\bsales\b/i,
    /\bmarket share\b/i,
    /\bdistribution\b/i,
    /\bdealer\b/i,
    /\bshowroom\b/i,
    /\bfleet\b/i,
    /\bpolicy\b/i,
    /\bregulation\b/i,
];

const LOW_VALUE_PATTERNS = [
    /\bfuel price(s)?\b/i,
    /\bpetrol price(s)?\b/i,
    /\bdiesel price(s)?\b/i,
    /\btraffic accident\b/i,
    /\broad closure\b/i,
    /\bparking fine(s)?\b/i,
    /\bspeed limit\b/i,
    /\bused car(s)?\b/i,
    /\bsecond[- ]hand car(s)?\b/i,
];

function countMatches(patterns, text) {
    return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function scoreUaeAutomotiveRelevance(item) {
    const haystack = `${item.source || ''} ${item.title || ''} ${item.snippet || ''} ${item.url || ''}`.toLowerCase();
    const uaeSignals = countMatches(UAE_PATTERNS, haystack);
    if (uaeSignals === 0) return { keep: false, score: 0, reason: 'no_uae_signal' };

    const brandSignals = countMatches(BRAND_PATTERNS, haystack);
    const autoSignals = countMatches(AUTO_TOPIC_PATTERNS, haystack);
    const marketSignals = countMatches(MARKET_SIGNAL_PATTERNS, haystack);
    const lowValueSignals = countMatches(LOW_VALUE_PATTERNS, haystack);

    const score = (uaeSignals * 4) + (brandSignals * 3) + (autoSignals * 2) + (marketSignals * 2) - (lowValueSignals * 5);

    if (lowValueSignals > 0 && brandSignals === 0 && marketSignals === 0) {
        return { keep: false, score, reason: 'low_value_general_news' };
    }

    if (brandSignals === 0 && autoSignals === 0) {
        return { keep: false, score, reason: 'no_auto_or_brand_signal' };
    }

    if (brandSignals === 0 && marketSignals === 0) {
        return { keep: false, score, reason: 'no_brand_or_market_signal' };
    }

    return { keep: score >= 7, score, reason: score >= 7 ? 'uae_auto_relevant' : 'score_too_low' };
}

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

function resolveUrl(baseUrl, href = '') {
    try {
        return new URL(href, baseUrl).toString();
    } catch {
        return '';
    }
}

async function collectOfficialOfferSource(source) {
    const startedAt = Date.now();

    try {
        const controller = new AbortController();
        const timerId = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(source.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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

        const html = await response.text();
        const $ = cheerio.load(html);
        const today = new Date().toISOString().split('T')[0];
        const rawDate = Date.now();
        const items = [{
            source: source.name,
            title: `${source.brand} UAE official offers / price tracker`,
            url: source.url,
            date: today,
            rawDate,
            snippet: `${source.brand} UAE official offers and price promotion page candidate for price tracking.`,
        }];

        const seen = new Set([normalizeUrl(source.url)]);
        $('a[href]').each((_, el) => {
            if (items.length >= 10) return false;
            const href = $(el).attr('href') || '';
            const absoluteUrl = resolveUrl(source.url, href);
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            const haystack = `${href} ${text}`.toLowerCase();
            const isRelevant = source.linkKeywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
            const normalizedUrl = normalizeUrl(absoluteUrl);

            if (!absoluteUrl || !isRelevant || seen.has(normalizedUrl)) return undefined;
            seen.add(normalizedUrl);
            items.push({
                source: source.name,
                title: text || `${source.brand} official offer page`,
                url: absoluteUrl,
                date: today,
                rawDate,
                snippet: `${source.brand} UAE official offer or price promotion page: ${text || absoluteUrl}`,
            });
            return undefined;
        });

        return {
            source: source.name,
            url: source.url,
            ok: true,
            status: response.status,
            reason: items.length > 0 ? 'ok' : 'no_official_offer_items',
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
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 3, 1), 15);
    const maxItems = Math.min(Math.max(parseInt(req.query.limit, 10) || 30, 5), 60);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const rssDiagnostics = await Promise.all(ALL_SOURCES.map((source) => collectSingleSource(source, cutoffTime)));
    const officialDiagnostics = await Promise.all(OFFICIAL_OFFER_SOURCES.map((source) => collectOfficialOfferSource(source)));
    const diagnostics = [...rssDiagnostics, ...officialDiagnostics];

    const seen = new Set();
    let prefilterSkipped = 0;
    const items = diagnostics
        .flatMap((result) => result.items)
        .map((item) => {
            const relevance = scoreUaeAutomotiveRelevance(item);
            return { ...item, relevanceScore: relevance.score, relevanceReason: relevance.reason, keepByRelevance: relevance.keep };
        })
        .filter((item) => {
            if (item.keepByRelevance) return true;
            prefilterSkipped += 1;
            return false;
        })
        .filter((item) => {
            const normalizedUrl = normalizeUrl(item.url);
            const normalizedTitle = normalizeText(item.title);
            const dedupeKey = normalizedUrl || `${normalizedTitle}::${item.date}`;
            if (seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        })
        .sort((a, b) => (b.relevanceScore - a.relevanceScore) || (b.rawDate - a.rawDate))
        .slice(0, maxItems)
        .map(({ keepByRelevance, ...item }) => item);

    return res.status(200).json({
        success: true,
        timeRange: `${days}d`,
        prefilter: {
            skipped: prefilterSkipped,
            returned: items.length,
            maxItems,
            scope: 'uae_only',
        },
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
