import { NewsType, SentimentType, NewsItem } from '../types';
import { DEFAULT_BRANDS } from '../constants';

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

export const analyzeTextWithQwen = async (
  text: string,
  currentBrands: string[] = DEFAULT_BRANDS,
): Promise<ExtractedNewsData> => {
  const brandsToPrompt = Array.from(new Set([...DEFAULT_BRANDS, ...currentBrands]));
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

Rules:
- summary must describe facts only, not recommendations.
- Do not mention opportunities, threats, implications, advice, or brand strategy.
- Do not infer business impact for any brand unless the source text states it directly.
- If the date is unclear, use ${today}.
- If the URL is unclear, use an empty string.
- If the brand is not in the allowed list, use "Other".

Output JSON:
{
  "title": "Chinese headline within 18 chars",
  "summary": "2-3 sentence factual Chinese summary",
  "brand": "Brand Name or Other",
  "type": "One of the allowed type values",
  "date": "YYYY-MM-DD",
  "url": "",
  "image_keywords": "english keywords",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    return await fetchAnalyze(text, systemPrompt) as ExtractedNewsData;
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
