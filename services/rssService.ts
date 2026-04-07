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
    skipped: number;
    total: number;
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
            const category = typeof raw.category === 'string' && ALLOWED_SIGNAL_CATEGORIES.has(raw.category as StrategySignal['category'])
                ? raw.category as StrategySignal['category']
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
        .filter(Boolean) as StrategySignal[])
        .slice(0, 5);
}

async function qwenExtract(item: RawRSSItem): Promise<NewsItem | null> {
    const systemPrompt = `You are a UAE automotive news screener.
Judge whether the item is directly relevant to the UAE or GCC automotive market and return strict JSON only.

If not relevant, return:
{"relevant":false}

If relevant, return:
{
  "relevant": true,
  "brand": "Brand name, 政策相关, or Other",
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

        if (!response.ok) return null;
        const data = await response.json();
        const content: string = data.output?.choices?.[0]?.message?.content || '';
        if (!content) return null;

        const parsed = JSON.parse(extractJsonObject(content));
        if (!parsed.relevant) return null;

        const parsedType = ALLOWED_TYPES.includes(parsed.type as NewsType)
            ? (parsed.type as NewsType)
            : NewsType.OTHER;

        return {
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
        };
    } catch (error) {
        console.error('[rssService] qwenExtract failed:', error);
        return null;
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
        return { imported: [], skipped: 0, total: 0 };
    }

    const imported: NewsItem[] = [];
    let skipped = 0;

    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        onProgress?.(i + 1, items.length, item.title);

        const result = await qwenExtract(item);
        if (result) imported.push(result);
        else skipped += 1;

        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return { imported, skipped, total: items.length };
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
