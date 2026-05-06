import { NewsItem, NewsType, StrategySignal } from '../types';

export interface RawRSSItem {
    source: string;
    title: string;
    url: string;
    date: string;
    rawDate: number;
    snippet: string;
}

export interface RSSFetchResult {
    imported: NewsItem[];
    directImported: number;
    fallbackImported: number;
    skipped: number;
    total: number;
    failedCandidates: Array<RawRSSItem & { reason: string }>;
}

const uid = () => `rss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ALLOWED_TYPES = [
    NewsType.LAUNCH_PHYSICAL,
    NewsType.TECH_OTA,
    NewsType.MARKET_SALES,
    NewsType.POLICY,
    NewsType.NETWORK_SERVICE,
    NewsType.COMPETITOR_TACTICS,
    NewsType.CORP_STRATEGY,
    NewsType.OTHER,
];

const ALLOWED_SIGNAL_CATEGORIES = new Set<StrategySignal['category']>([
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

const UAE_HINT_PATTERNS = [
    /\buae\b/i,
    /\bdubai\b/i,
    /\babu dhabi\b/i,
    /\bsharjah\b/i,
    /\bajman\b/i,
    /\bras al khaimah\b/i,
    /\bfujairah\b/i,
    /\bumm al quwain\b/i,
    /\bemirates\b/i,
    /\baed\b/i,
];

const AUTO_HINT_PATTERNS = [
    /\bev\b/i,
    /\bhybrid\b/i,
    /\bvehicle\b/i,
    /\bauto\b/i,
    /\bautomotive\b/i,
    /\bcar\b/i,
    /\bsuv\b/i,
    /\bsedan\b/i,
    /\bdealer\b/i,
    /\bshowroom\b/i,
    /\bservice center\b/i,
    /\bcharging\b/i,
];

const MARKET_HINT_PATTERNS = [
    /\blaunch\b/i,
    /\bprice\b/i,
    /\bdiscount\b/i,
    /\bfinance\b/i,
    /\bwarranty\b/i,
    /\binsurance\b/i,
    /\bdelivery\b/i,
    /\bregistration\b/i,
    /\bsales\b/i,
    /\bmarket share\b/i,
    /\bdistribution\b/i,
    /\bfleet\b/i,
    /\bpolicy\b/i,
    /\bregulation\b/i,
];

const BRAND_HINT_PATTERNS = [
    /\bchangan\b/i,
    /\bdeepal\b/i,
    /\bavatr\b/i,
    /\bbyd\b/i,
    /\bgeely\b/i,
    /\bchery\b/i,
    /\bjaecoo\b/i,
    /\bomoda\b/i,
    /\bmg\b/i,
    /\bgwm\b/i,
    /\bhaval\b/i,
    /\btank\b/i,
    /\bjetour\b/i,
    /\btoyota\b/i,
    /\bnissan\b/i,
    /\bhyundai\b/i,
    /\bkia\b/i,
    /\bbmw\b/i,
    /\bmercedes\b/i,
    /\baudi\b/i,
    /\blexus\b/i,
    /\bford\b/i,
];

const LOW_VALUE_HINT_PATTERNS = [
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

function countMatches(patterns: RegExp[], text: string): number {
    return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function extractJsonObject(rawContent: string): string {
    const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    return start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
}

function normalizeStrategySignals(signals: unknown): StrategySignal[] {
    if (!Array.isArray(signals)) return [];

    return (signals
        .map<StrategySignal | null>((signal) => {
            if (!signal || typeof signal !== 'object') return null;
            const raw = signal as Record<string, unknown>;
            const category =
                typeof raw.category === 'string' && ALLOWED_SIGNAL_CATEGORIES.has(raw.category as StrategySignal['category'])
                    ? (raw.category as StrategySignal['category'])
                    : 'other';
            const action = typeof raw.action === 'string' ? raw.action.trim() : '';
            const model = typeof raw.model === 'string' ? raw.model.trim() : undefined;
            const msrp = typeof raw.msrp === 'string' ? raw.msrp.trim() : undefined;
            const currency = typeof raw.currency === 'string' ? raw.currency.trim() : undefined;
            const current_value = typeof raw.current_value === 'string' ? raw.current_value.trim() : undefined;
            const previous_value = typeof raw.previous_value === 'string' ? raw.previous_value.trim() : undefined;
            const note = typeof raw.note === 'string' ? raw.note.trim() : undefined;
            const raw_excerpt = typeof raw.raw_excerpt === 'string' ? raw.raw_excerpt.trim() : undefined;

            if (!action) return null;
            return { category, action, model, msrp, currency, current_value, previous_value, note, raw_excerpt };
        })
        .filter(Boolean) as StrategySignal[]).slice(0, 5);
}

function createFallbackItem(
    item: RawRSSItem,
    options?: { tags?: string[]; summary?: string },
): NewsItem {
    return {
        id: uid(),
        brand: 'Other',
        date: item.date,
        type: NewsType.OTHER,
        title: item.title,
        summary: options?.summary || item.snippet || item.title,
        tags: options?.tags || ['待复核', '自动降级'],
        url: item.url,
        source: item.source,
    };
}

function shouldFallbackWhenRejected(item: RawRSSItem): boolean {
    const haystack = `${item.source} ${item.title} ${item.snippet} ${item.url}`.toLowerCase();
    const uaeSignals = countMatches(UAE_HINT_PATTERNS, haystack);
    if (uaeSignals === 0) return false;

    const brandSignals = countMatches(BRAND_HINT_PATTERNS, haystack);
    const autoSignals = countMatches(AUTO_HINT_PATTERNS, haystack);
    const marketSignals = countMatches(MARKET_HINT_PATTERNS, haystack);
    const lowValueSignals = countMatches(LOW_VALUE_HINT_PATTERNS, haystack);

    if (lowValueSignals > 0 && brandSignals === 0 && marketSignals === 0) return false;
    if (brandSignals === 0) return false;

    const relevanceScore = (uaeSignals * 4) + (brandSignals * 3) + (autoSignals * 2) + (marketSignals * 2) - (lowValueSignals * 5);
    return relevanceScore >= 10;
}

async function qwenExtract(item: RawRSSItem): Promise<{
    status: 'imported' | 'fallback' | 'skipped' | 'failed';
    item: NewsItem | null;
    reason?: string;
}> {
    const systemPrompt = `You are a UAE automotive news screener.
Judge whether the item is directly relevant to the UAE automotive market and return strict JSON only.

Reject items that are only about the broader GCC, Middle East, or global market unless the title, snippet, source, or URL explicitly mentions UAE, Dubai, Abu Dhabi, another UAE emirate, Emirates, or AED.

If not relevant, return:
{"relevant":false}

If relevant, return:
{
  "relevant": true,
  "brand": "Brand name, policy related, or Other",
  "chineseTitle": "Chinese headline within 18 chars",
  "type": "One of: Launch (Physical), Tech & OTA, Market & Sales, Policy & Regulation, Network & Service, Competitor Tactics, Corp & Strategy, Other",
  "summary": "1-2 sentence factual Chinese summary with no recommendation or inference",
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
- Only include strategy_signals when the source explicitly describes a concrete tactic move.
- Good examples: 0 down payment, AED 45,000 cash discount, discount reduced from AED 50,000 to AED 45,000, free insurance, extended warranty, trade-in bonus, dealer expansion, stock arrival.
- Do not guess product names, old prices, reasons, or business implications.
- Summary must stay factual.`;

    try {
        const response = await fetch('/api/ai?action=analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: systemPrompt,
                text: `Title: ${item.title}\nSnippet: ${item.snippet}\nSource: ${item.source}\nURL: ${item.url}\nDate: ${item.date}`,
            }),
        });

        if (!response.ok) {
            return {
                status: 'fallback',
                item: createFallbackItem(item),
                reason: `AI service HTTP ${response.status}`,
            };
        }

        const data = await response.json();
        const content: string = data.output?.choices?.[0]?.message?.content || '';

        if (!content) {
            return {
                status: 'fallback',
                item: createFallbackItem(item),
                reason: 'AI returned empty content',
            };
        }

        const parsed = JSON.parse(extractJsonObject(content));

        if (!parsed.relevant) {
            if (shouldFallbackWhenRejected(item)) {
                return {
                    status: 'fallback',
                    item: createFallbackItem(item, {
                        tags: ['待复核', 'AI未确认', '自动降级'],
                    }),
                    reason: 'AI rejected but heuristic fallback kept item',
                };
            }

            return {
                status: 'skipped',
                item: null,
                reason: 'AI marked as irrelevant',
            };
        }

        const parsedType = ALLOWED_TYPES.includes(parsed.type as NewsType)
            ? (parsed.type as NewsType)
            : NewsType.OTHER;

        return {
            status: 'imported',
            item: {
                id: uid(),
                brand: parsed.brand || 'Other',
                date: item.date,
                type: parsedType,
                title: parsed.chineseTitle || item.title,
                summary: parsed.summary || item.snippet,
                tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : [],
                model: typeof parsed.model === 'string' ? parsed.model.trim() : '',
                msrp: typeof parsed.msrp === 'string' ? parsed.msrp.trim() : '',
                currency: typeof parsed.currency === 'string' ? parsed.currency.trim() : '',
                strategySignals: normalizeStrategySignals(parsed.strategy_signals),
                url: item.url,
                source: item.source,
            },
        };
    } catch (error) {
        console.error('[rssService] qwenExtract failed:', error);
        return {
            status: 'fallback',
            item: createFallbackItem(item),
            reason: error instanceof Error ? error.message : 'AI extraction failed',
        };
    }
}

export async function fetchAndScreenRSS(
    days: number = 3,
    onProgress?: (current: number, total: number, title: string) => void,
): Promise<RSSFetchResult> {
    const rssRes = await fetch(`/api/collect?action=rss&days=${days}`);
    if (!rssRes.ok) throw new Error('RSS service request failed');
    const { items }: { items: RawRSSItem[] } = await rssRes.json();

    if (!items || items.length === 0) {
        return { imported: [], directImported: 0, fallbackImported: 0, skipped: 0, total: 0, failedCandidates: [] };
    }

    const imported: NewsItem[] = [];
    const failedCandidates: Array<RawRSSItem & { reason: string }> = [];
    let directImported = 0;
    let fallbackImported = 0;
    let skipped = 0;

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        onProgress?.(i + 1, items.length, item.title);

        const result = await qwenExtract(item);
        if (result.status === 'imported' && result.item) {
            imported.push(result.item);
            directImported += 1;
        } else if (result.status === 'fallback' && result.item) {
            imported.push(result.item);
            fallbackImported += 1;
            failedCandidates.push({ ...item, reason: result.reason || '已降级导入' });
        } else if (result.status === 'failed') {
            failedCandidates.push({ ...item, reason: result.reason || '处理失败' });
        } else {
            skipped += 1;
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return {
        imported,
        directImported,
        fallbackImported,
        skipped,
        total: items.length,
        failedCandidates,
    };
}

export async function generateDailyDigest(items: NewsItem[], options?: { startDate?: string; endDate?: string }): Promise<string> {
    const response = await fetch('/api/ai?action=digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, ...options }),
    });

    if (!response.ok) throw new Error('Digest generation failed');
    const data = await response.json();
    return data.digest || '暂无内容';
}
