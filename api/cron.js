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
    'MG Motor UAE new model',
    'Chery Tiggo UAE launch',
    'Omoda UAE price',
    'Geely Monjaro UAE',
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
    ...OFFICIAL_X_ACCOUNTS.flatMap((account) => NITTER_INSTANCES.map((_, index) => toNitterRSS(account.handle, account.brand, index))),
    ...GOOGLE_NEWS_KEYWORDS.map(toGoogleNewsRSS),
];

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
    const systemPrompt = `You are a UAE automotive market intelligence analyst.
Return valid JSON only.

If the news is not directly relevant to the UAE or GCC automotive market, return:
{"relevant":false}

If relevant, return:
{
  "relevant": true,
  "brand": "one brand name or Policy",
  "chineseTitle": "short Chinese headline within 15 chars",
  "type": "Launch (Physical) | Tech & OTA | Market & Sales | Policy | Network & Service | Competitor Tactics | Corp Strategy | Other",
  "summary": "1-2 sentence factual Chinese summary",
  "tags": ["tag1", "tag2"]
}`;

    try {
        const { response, data } = await callQwen(apiKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Title: ${item.title}\nSummary: ${item.snippet}\nSource: ${item.source}` },
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
            tags: parsed.tags || [],
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

    const systemPrompt = `You are preparing a concise Chinese UAE automotive daily digest.
Use headings only for categories that have content.
Be factual and brief. Do not add recommendations.
Start with:
## UAE Auto Daily Digest
**Coverage: ${dateRange}**`;

    const { response, data } = await callQwen(apiKey, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: groupedText },
    ], 0.3);

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
        const results = await Promise.all(ALL_SOURCES.map((source) => fetchSingleRSS(source, cutoffTime)));

        const seen = new Set();
        const rawItems = results
            .flat()
            .filter((item) => {
                const key = `${item.title}::${item.url}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => b.rawDate - a.rawDate)
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
