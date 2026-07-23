import { NewsType, SentimentType, NewsItem, StrategySignal } from '../types';
import { DEFAULT_BRANDS } from '../constants';
import { CANONICAL_BRANDS, normalizeNewsBrand } from '../utils/brandNormalization';

export interface ExtractedNewsData {
  title: string;
  summary: string;
  brand: string;
  type: NewsType;
  date: string;
  url: string;
  image_keywords: string;
  sentiment?: SentimentType;
  tags: string[];
  model?: string;
  msrp?: string;
  currency?: string;
  strategy_signals?: StrategySignal[];
}

export interface BrandReportData {
  executive_summary: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export interface WeeklySummaryData {
  executive_summary: string;
  top_trends: Array<{
    title: string;
    evidence: string;
    implication: string;
  }>;
}

const today = new Date().toISOString().split('T')[0];

const extractJsonObject = (rawContent: string): string => {
  const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  return firstOpen !== -1 && lastClose !== -1 ? cleaned.substring(firstOpen, lastClose + 1) : cleaned;
};

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

const ALLOWED_NEWS_TYPES = new Set<NewsType>([
  NewsType.LAUNCH_PHYSICAL,
  NewsType.TECH_OTA,
  NewsType.MARKET_SALES,
  NewsType.POLICY,
  NewsType.NETWORK_SERVICE,
  NewsType.COMPETITOR_TACTICS,
  NewsType.CORP_STRATEGY,
  NewsType.OTHER,
]);

const normalizeStrategySignals = (signals: unknown): StrategySignal[] => {
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
};

const fetchAnalyze = async (text: string, prompt: string) => {
  const response = await fetch('/api/ai?action=analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, prompt }),
  });

  if (!response.ok) {
    let errorMsg = `Server Error: ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      const fallback = await response.text();
      if (fallback) errorMsg += ` - ${fallback.slice(0, 80)}`;
    }
    throw new Error(errorMsg);
  }

  const rawData = await response.json();
  const rawContent = rawData.output?.choices?.[0]?.message?.content || '';
  if (!rawContent) throw new Error('AI returned empty content');
  return JSON.parse(extractJsonObject(rawContent));
};

const normalizeExtractedData = (parsed: Partial<ExtractedNewsData>): ExtractedNewsData => ({
  title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : '未命名资讯',
  summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
  brand: normalizeNewsBrand({
    brand: typeof parsed.brand === 'string' ? parsed.brand : '',
    title: typeof parsed.title === 'string' ? parsed.title : '',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    model: typeof parsed.model === 'string' ? parsed.model : '',
    url: typeof parsed.url === 'string' ? parsed.url : '',
  }),
  type: ALLOWED_NEWS_TYPES.has(parsed.type as NewsType) ? parsed.type as NewsType : NewsType.OTHER,
  date: typeof parsed.date === 'string' && parsed.date.trim() ? parsed.date.trim() : today,
  url: typeof parsed.url === 'string' ? parsed.url.trim() : '',
  image_keywords: typeof parsed.image_keywords === 'string' && parsed.image_keywords.trim() ? parsed.image_keywords.trim() : 'car news',
  sentiment: parsed.sentiment,
  tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 5) : [],
  model: typeof parsed.model === 'string' ? parsed.model.trim() : '',
  msrp: typeof parsed.msrp === 'string' ? parsed.msrp.trim() : '',
  currency: typeof parsed.currency === 'string' ? parsed.currency.trim() : '',
  strategy_signals: normalizeStrategySignals(parsed.strategy_signals),
});

export const analyzeTextWithQwen = async (
  text: string,
  currentBrands: string[] = DEFAULT_BRANDS,
): Promise<ExtractedNewsData> => {
  const brandsToPrompt = Array.from(new Set([...DEFAULT_BRANDS, ...CANONICAL_BRANDS, ...currentBrands]));
  const brandsString = brandsToPrompt.join(', ');

  const systemPrompt = `You are an automotive news extraction engine for the UAE market.
Return strict JSON only. Do not include markdown fences. Do not add explanation.

Goals:
1. Extract the main brand. It must be one of [${brandsString}] or "Other".
2. Write a factual Chinese headline and factual Chinese summary.
3. Classify type using exactly one of:
- ${NewsType.LAUNCH_PHYSICAL}
- ${NewsType.TECH_OTA}
- ${NewsType.MARKET_SALES}
- ${NewsType.POLICY}
- ${NewsType.NETWORK_SERVICE}
- ${NewsType.COMPETITOR_TACTICS}
- ${NewsType.CORP_STRATEGY}
- ${NewsType.OTHER}
4. Extract 3-5 tags.
5. image_keywords must be 3-6 simple English keywords.
6. Extract strategy_signals only when the source text explicitly states a concrete tactic change.
7. If the source explicitly states a model name or MSRP/list price, extract them.

Rules:
- summary must describe facts only, not recommendations.
- Do not mention opportunities, threats, implications, advice, or brand strategy.
- Do not infer business impact for any brand unless the source text states it directly.
- strategy_signals must be empty if the text does not clearly describe a concrete offer, pricing move, finance plan, insurance policy, trade-in offer, service policy, campaign, channel expansion, or inventory move.
- Use model only when the source explicitly names the product/model.
- Use msrp only when the source explicitly states a list price / MSRP / starting price / official price guidance.
- Do not guess product names, discount sizes, old prices, or policy changes.
- If the text says "0 down payment", "cash discount cut from AED 50,000 to AED 45,000", or "extended warranty/insurance added", capture those as strategy_signals.
- If the date is unclear, use ${today}.
- If the URL is unclear, use an empty string.
- If the brand is not in the allowed list, use "Other".
- Use canonical brand names when aliases are present. Examples: BYD => BYD 比亚迪; GWM/Haval/Tank => GWM 长城; iCAUR => Chery iCAUR; OMODA/JAECOO => Omoda & Jaecoo.

Output JSON:
{
  "title": "Chinese headline within 18 chars",
  "summary": "2-3 sentence factual Chinese summary",
  "brand": "Brand Name or Other",
  "type": "One of the allowed type values",
  "date": "YYYY-MM-DD",
  "url": "",
  "image_keywords": "english keywords",
  "tags": ["tag1", "tag2", "tag3"],
  "model": "explicit model name or empty string",
  "msrp": "explicit list price or empty string",
  "currency": "AED or empty string",
  "strategy_signals": [
    {
      "category": "price | finance | insurance | trade_in | service | campaign | distribution | inventory | charging | delivery | buyback | fleet | bundle | other",
      "action": "short factual description in Chinese",
      "model": "explicit model name if stated",
      "msrp": "explicit list price if stated",
      "currency": "AED if stated",
      "current_value": "current offer/value if explicitly stated",
      "previous_value": "previous offer/value if explicitly stated",
      "note": "product or scope if explicitly stated",
      "raw_excerpt": "short source phrase if useful"
    }
  ]
}`;

  try {
    const parsed = await fetchAnalyze(text, systemPrompt) as ExtractedNewsData;
    return normalizeExtractedData({
      ...parsed,
      model: typeof (parsed as any).model === 'string' ? (parsed as any).model.trim() : '',
      msrp: typeof (parsed as any).msrp === 'string' ? (parsed as any).msrp.trim() : '',
      currency: typeof (parsed as any).currency === 'string' ? (parsed as any).currency.trim() : '',
      strategy_signals: normalizeStrategySignals(parsed.strategy_signals),
    });
  } catch (error: any) {
    console.error('Qwen Analysis Failed:', error);
    throw new Error(error.message || '智能分析服务暂时不可用');
  }
};

export const generateBrandReport = async (
  brand: string,
  periodLabel: string,
  newsList: NewsItem[],
): Promise<BrandReportData> => {
  const newsContext = newsList.map((item) => `[${item.date}] [${item.type}] ${item.title}`).join('\n');

  const systemPrompt = `You are a senior automotive strategy analyst.
Write a concise Chinese brand briefing for "${brand}" during "${periodLabel}".
Return strict JSON only.

Rules:
- executive_summary should be about 120-180 Chinese characters.
- Base the summary only on the provided news.
- SWOT points should be short phrases, not full paragraphs.
- If evidence is weak, keep the point conservative.

Output JSON:
{
  "executive_summary": "Chinese summary",
  "swot": {
    "strengths": ["point 1", "point 2"],
    "weaknesses": ["point 1", "point 2"],
    "opportunities": ["point 1", "point 2"],
    "threats": ["point 1", "point 2"]
  }
}`;

  try {
    return await fetchAnalyze(`News Context:\n${newsContext}`, systemPrompt) as BrandReportData;
  } catch (error: any) {
    console.error('Report Generation Error:', error);
    throw error;
  }
};

export const generateWeeklySummary = async (
  newsList: NewsItem[],
  period: string,
): Promise<WeeklySummaryData> => {
  const keyItems = newsList
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15)
    .map((item) => `[${item.date}][${item.brand}][${item.type}] ${item.title}`)
    .join('\n');

  const systemPrompt = `You are a senior UAE automotive market analyst.
Summarize the period "${period}" into a factual Chinese weekly brief.
Return strict JSON only.

Rules:
- executive_summary: 2-3 Chinese sentences, factual and high-level.
- top_trends: exactly 3 items.
- title: Chinese, <= 10 chars.
- evidence: cite one concrete event from the news list.
- implication: explain the market-level meaning in neutral language.
- You may mention Changan only when it appears in the source items.
- Do not frame implications from Changan's point of view unless the source text itself supports it.
- Do not invent evidence outside the input.

Output JSON:
{
  "executive_summary": "Chinese summary",
  "top_trends": [
    {
      "title": "趋势名称",
      "evidence": "具体事件",
      "implication": "对市场的含义"
    },
    {
      "title": "趋势名称",
      "evidence": "具体事件",
      "implication": "对市场的含义"
    },
    {
      "title": "趋势名称",
      "evidence": "具体事件",
      "implication": "对市场的含义"
    }
  ]
}`;

  return await fetchAnalyze(`News Context:\n${keyItems}`, systemPrompt) as WeeklySummaryData;
};
