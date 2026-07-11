/**
 * /api/cron
 *
 * Daily pipeline:
 * 1. Validate x-cron-secret
 * 2. Collect raw RSS/Google News items from the last 24h
 * 3. Ask Qwen to filter and structure relevant UAE automotive items
 * 4. Ask Qwen to generate a concise digest
 * 5. Push the digest to the configured webhook
 */

import * as cheerio from 'cheerio';

const QWEN_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

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
    'Changan car UAE launch',
    'Changan Uni UAE price',
    'Changan electric vehicle UAE',
    'BYD UAE price',
    'site:byduae.ae/en BYD UAE offers price',
    'MG Motor UAE new model',
    'Chery Tiggo UAE launch',
    'Omoda UAE price',
    'site:icauruae.com iCAUR UAE offers price',
    'Geely Monjaro UAE',
    'site:geely.ae/en Geely UAE offers price',
    'GAC Aion UAE electric',
    'Jetour UAE launch',
    'UAE car sales figures',
    'Dubai Motor Show',
    'Dubai EV charging station DEWA',
    'UAE EV registration statistics',
    'RTA Dubai vehicle registration new rules',
    'UAE vehicle import regulation',
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
    ...OFFICIAL_X_ACCOUNTS.flatMap((account) =>
        NITTER_INSTANCES.map((_, index) => toNitterRSS(account.handle, account.brand, index)),
    ),
    ...GOOGLE_NEWS_KEYWORDS.map(toGoogleNewsRSS),
];

const ALLOWED_SIGNAL_CATEGORIES = new Set([
    'price',
    'finance',
    'insurance',
    'trade_in',
    'service',
    'campaign',
    'distribution',
    'inventory',
    'charging',
    'delivery',
    'buyback',
    'fleet',
    'bundle',
    'other',
]);

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
    if (uaeSignals === 0) return { keep: false, score: 0 };

    const brandSignals = countMatches(BRAND_PATTERNS, haystack);
    const autoSignals = countMatches(AUTO_TOPIC_PATTERNS, haystack);
    const marketSignals = countMatches(MARKET_SIGNAL_PATTERNS, haystack);
    const lowValueSignals = countMatches(LOW_VALUE_PATTERNS, haystack);
    const score = (uaeSignals * 4) + (brandSignals * 3) + (autoSignals * 2) + (marketSignals * 2) - (lowValueSignals * 5);

    if (lowValueSignals > 0 && brandSignals === 0 && marketSignals === 0) return { keep: false, score };
    if (brandSignals === 0 && autoSignals === 0) return { keep: false, score };
    if (brandSignals === 0 && marketSignals === 0) return { keep: false, score };
    return { keep: score >= 7, score };
}

function normalizeStrategySignals(signals) {
    if (!Array.isArray(signals)) return [];

    return signals
        .map((signal) => {
            if (!signal || typeof signal !== 'object') return null;
            const category = typeof signal.category === 'string' && ALLOWED_SIGNAL_CATEGORIES.has(signal.category)
                ? signal.category
                : 'other';
            const action = typeof signal.action === 'string' ? signal.action.trim() : '';
            const model = typeof signal.model === 'string' ? signal.model.trim() : undefined;
            const msrp = typeof signal.msrp === 'string' ? signal.msrp.trim() : undefined;
            const currency = typeof signal.currency === 'string' ? signal.currency.trim() : undefined;
            const current_value = typeof signal.current_value === 'string' ? signal.current_value.trim() : undefined;
            const previous_value = typeof signal.previous_value === 'string' ? signal.previous_value.trim() : undefined;
            const note = typeof signal.note === 'string' ? signal.note.trim() : undefined;
            const raw_excerpt = typeof signal.raw_excerpt === 'string' ? signal.raw_excerpt.trim() : undefined;

            if (!action) return null;
            return { category, action, model, msrp, currency, current_value, previous_value, note, raw_excerpt };
        })
        .filter(Boolean)
        .slice(0, 5);
}

function extractFeedItems(source, xml, cutoffTime, maxItems = 10) {
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

function resolveUrl(baseUrl, href = '') {
    try {
        return new URL(href, baseUrl).toString();
    } catch {
        return '';
    }
}

async function fetchOfficialOfferSource(source) {
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
        if (!response.ok) return [];

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
            if (items.length >= 6) return false;
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

        return items;
    } catch {
        return [];
    }
}

async function fetchSingleRSS(source, cutoffTime) {
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
        if (!response.ok) return [];

        const xml = await response.text();
        if (!/<(rss|feed|rdf:RDF)\b/i.test(xml)) return [];
        return extractFeedItems(source, xml, cutoffTime, 10);
    } catch {
        return [];
    }
}

async function callQwen(apiKey, messages, temperature = 0.1) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 55000);

    try {
        const response = await fetch(QWEN_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'qwen-plus',
                input: { messages },
                parameters: { result_format: 'message', temperature, top_p: 0.8 },
            }),
            signal: controller.signal,
        });
        clearTimeout(timerId);
        return { response, data: await response.json() };
    } catch (error) {
        clearTimeout(timerId);
        throw error;
    }
}

async function qwenAnalyzeItem(item, apiKey) {
    const systemPrompt = `You are a UAE automotive news screener.
Judge whether the item is directly relevant to the UAE automotive market and return strict JSON only.

Reject items that are only about the broader GCC, Middle East, or global market unless the title, snippet, source, or URL explicitly mentions UAE, Dubai, Abu Dhabi, another UAE emirate, Emirates, or AED.

If not relevant, return:
{"relevant":false}

If relevant, return:
{
  "relevant": true,
  "brand": "Brand name, 政策相关, or Other",
  "chineseTitle": "Chinese headline within 18 chars",
  "type": "One of: Launch (Physical), Tech & OTA, Market & Sales, Policy & Regulation, Network & Service, Competitor Tactics, Corp & Strategy, Other",
  "summary": "1-2 sentence factual Chinese summary",
  "tags": ["up to 3 short tags"],
  "model": "explicit model name or empty string",
  "msrp": "explicit list price or empty string",
  "currency": "AED or empty string",
  "strategy_signals": [
    {
      "category": "price | finance | insurance | trade_in | service | campaign | distribution | inventory | charging | delivery | buyback | fleet | bundle | other",
      "action": "short factual Chinese description",
      "model": "explicit model name if stated",
      "msrp": "explicit list price if stated",
      "currency": "AED if stated",
      "current_value": "current offer/value if explicitly stated",
      "previous_value": "previous offer/value if explicitly stated",
      "note": "product or scope if explicitly stated",
      "raw_excerpt": "short source phrase if useful"
    }
  ]
}

Rules:
- strategy_signals must stay empty unless the source explicitly states a tactic move.
- Good examples: 0 down payment, cash discount, reduced discount, free insurance, warranty extension, trade-in subsidy, dealer expansion, stock arrival.
- Do not infer reasons, opportunities, or business impact.`;

    try {
        const { response, data } = await callQwen(apiKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Title: ${item.title}\nSnippet: ${item.snippet}\nSource: ${item.source}\nURL: ${item.url}\nDate: ${item.date}` },
        ]);

        if (!response.ok) return null;
        const content = data.output?.choices?.[0]?.message?.content || '';
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) return null;

        const parsed = JSON.parse(match[0]);
        if (!parsed.relevant) return null;

        return {
            id: `cron-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            brand: parsed.brand || 'Other',
            date: item.date,
            type: parsed.type || 'Other',
            title: parsed.chineseTitle || item.title,
            summary: parsed.summary || item.snippet,
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
            model: typeof parsed.model === 'string' ? parsed.model.trim() : '',
            msrp: typeof parsed.msrp === 'string' ? parsed.msrp.trim() : '',
            currency: typeof parsed.currency === 'string' ? parsed.currency.trim() : '',
            strategySignals: normalizeStrategySignals(parsed.strategy_signals),
            url: item.url,
            source: item.source,
        };
    } catch {
        return null;
    }
}

async function generateDigest(items, apiKey) {
    const dates = items.map((item) => item.date).filter(Boolean).sort();
    const dateRange = dates.length > 0 ? `${dates[0]} ~ ${dates[dates.length - 1]}` : new Date().toISOString().split('T')[0];

    const grouped = {};
    items.forEach((item) => {
        const type = item.type || 'Other';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(`- [${item.brand}] ${item.title}: ${item.summary || ''}`);
    });

    const groupedText = Object.entries(grouped)
        .map(([type, lines]) => `### ${type}\n${lines.slice(0, 8).join('\n')}`)
        .join('\n\n');

    const systemPrompt = `You are a UAE automotive market editor.
Generate a concise Chinese daily digest using only the provided news.

Rules:
- The first line must be "# 阿联酋汽车市场日报"
- The second line must be "*覆盖时间：${dateRange}*"
- Use Chinese throughout.
- Keep the writing factual and concise.
- Do not add recommendations, action items, or external facts.
- Reuse the provided category names as section headings.
- Do not return JSON or markdown code fences.`;

    const { response, data } = await callQwen(apiKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please summarize the following news:\n\n${groupedText}` },
    ], 0.2);

    if (!response.ok) throw new Error(`Qwen digest failed: ${data.message || response.status}`);
    return data.output?.choices?.[0]?.message?.content || '';
}

async function pushToWebhook(digest, webhookUrl, webhookType = 'wechat') {
    const title = `UAE Auto Daily Digest ${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
    const truncated = digest.length > 3800 ? `${digest.substring(0, 3800)}\n\n...(truncated)` : digest;

    let payload;
    if (webhookType === 'wechat') payload = { msgtype: 'markdown', markdown: { content: truncated } };
    else if (webhookType === 'dingtalk') payload = { msgtype: 'markdown', markdown: { title, text: truncated } };
    else if (webhookType === 'lark') payload = { msg_type: 'interactive', card: { config: { wide_screen_mode: true }, elements: [{ tag: 'markdown', content: truncated }] } };
    else throw new Error(`Unsupported webhook type: ${webhookType}`);

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
        throw new Error(data.errmsg || `Webhook push failed: HTTP ${response.status}`);
    }
    return true;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return res.status(503).json({ error: 'CRON_SECRET is not configured' });

    const incomingSecret = req.headers['x-cron-secret'];
    if (incomingSecret !== cronSecret) {
        return res.status(401).json({ error: 'Invalid x-cron-secret' });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'DASHSCOPE_API_KEY is not configured' });

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return res.status(503).json({ error: 'WEBHOOK_URL is not configured' });

    const webhookType = process.env.WEBHOOK_TYPE || 'wechat';
    const startTime = Date.now();

    try {
        const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
        const rssResults = await Promise.all(ALL_SOURCES.map((source) => fetchSingleRSS(source, cutoffTime)));
        const officialOfferResults = await Promise.all(OFFICIAL_OFFER_SOURCES.map((source) => fetchOfficialOfferSource(source)));
        const results = [...rssResults, ...officialOfferResults];

        const seen = new Set();
        const rawItems = results
            .flat()
            .map((item) => {
                const relevance = scoreUaeAutomotiveRelevance(item);
                return { ...item, relevanceScore: relevance.score, keepByRelevance: relevance.keep };
            })
            .filter((item) => item.keepByRelevance)
            .filter((item) => {
                const key = normalizeUrl(item.url) || `${normalizeText(item.title)}::${item.date}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => (b.relevanceScore - a.relevanceScore) || (b.rawDate - a.rawDate))
            .slice(0, 30);

        if (rawItems.length === 0) {
            return res.status(200).json({ success: true, message: 'No recent source items', imported: 0 });
        }

        const imported = [];
        for (const item of rawItems) {
            const analyzed = await qwenAnalyzeItem(item, apiKey);
            if (analyzed) imported.push(analyzed);
            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (imported.length === 0) {
            return res.status(200).json({ success: true, message: 'No relevant market items', imported: 0 });
        }

        const digest = await generateDigest(imported, apiKey);
        await pushToWebhook(digest, webhookUrl, webhookType);

        return res.status(200).json({
            success: true,
            imported: imported.length,
            skipped: rawItems.length - imported.length,
            pushed: true,
            elapsedSeconds: Math.round((Date.now() - startTime) / 1000),
        });
    } catch (error) {
        console.error('[cron]', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
