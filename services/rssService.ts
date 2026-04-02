import { NewsItem, NewsType } from '../types';

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

function extractJsonObject(rawContent: string): string {
    const cleaned = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    return start !== -1 && end !== -1 ? cleaned.slice(start, end + 1) : cleaned;
}

async function qwenExtract(item: RawRSSItem): Promise<NewsItem | null> {
    const systemPrompt = `你是一名阿联酋汽车市场新闻标注员。你的任务是判断新闻是否与 UAE / GCC 汽车市场直接相关，并输出严格 JSON。

判定为相关，必须同时满足：
1. 新闻明确涉及 UAE、Dubai、Abu Dhabi、GCC、Middle East 汽车市场，或者明确描述将在 UAE / GCC 落地的汽车动作。
2. 新闻属于汽车行业实质事件，例如：车型上市、价格、销量、经销网络、充电设施、政策、企业合作、促销动作。

直接判定为不相关：
- 仅涉及欧美、中国本土、东南亚等其他市场，且未说明 UAE / GCC 关联。
- 资本市场、股价、管理层人事、娱乐营销、体育赞助。
- 二手车挂牌、分类广告、个人卖车信息。
- 文中没有足够信息判断品牌或事件。

如果不相关，只返回：
{"relevant":false}

如果相关，只返回合法 JSON，不要代码块，不要解释：
{
  "relevant": true,
  "brand": "品牌名；若是政府/监管新闻可写政策相关；不确定则写Other",
  "chineseTitle": "不超过18字的中文标题",
  "type": "必须是以下之一：Launch (Physical), Tech & OTA, Market & Sales, Policy & Regulation, Network & Service, Competitor Tactics, Corp & Strategy, Other",
  "summary": "1-2句中文事实摘要，不写建议，不写长安视角，不写推测",
  "tags": ["最多3个中文或英文短标签"]
}`;

    try {
        const response = await fetch('/api/ai?action=analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: systemPrompt,
                text: `标题: ${item.title}\n摘要: ${item.snippet}\n来源: ${item.source}\n链接: ${item.url}\n日期: ${item.date}`,
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

export async function generateDailyDigest(items: NewsItem[]): Promise<string> {
    const response = await fetch('/api/ai?action=digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });

    if (!response.ok) throw new Error('Digest generation failed');
    const data = await response.json();
    return data.digest || '暂无内容';
}
