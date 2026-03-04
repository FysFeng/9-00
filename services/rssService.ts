/**
 * rssService.ts
 * 客户端 RSS 采集服务：
 * 1. 调用 /api/rss 拉取原始 RSS 条目
 * 2. 逐条调用 /api/analyze（Qwen）判断与 UAE 汽车市场的相关性
 * 3. 对相关条目提炼品牌/类型/中文摘要，返回结构化 NewsItem
 */

import { NewsItem, NewsType } from '../types';
import { NEWS_TYPES_LIST } from '../constants';

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

// 生成 UUID-like id
const uid = () => `rss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// 调用 /api/analyze 请求 Qwen 结构化提取
async function qwenExtract(item: RawRSSItem): Promise<NewsItem | null> {
    const systemPrompt = `你是长安汽车阿联酋销售团队的市场分析助手。
分析以下新闻标题和摘要，判断是否与"阿联酋汽车市场"相关（品牌动态、车型、价格、政策、销量等）。

如果相关，返回 JSON（不要加 markdown 代码块）：
{
  "relevant": true,
  "brand": "品牌名（中英文均可，如 Changan 长安 / BYD 比亚迪 / Toyota 丰田 / 其他品牌），若无法确定填 其他品牌",
  "type": "以下之一: launch | sales | price | channel | corp | policy | tech | other",
  "summary": "用中文写 50 字以内的摘要，说明这条新闻的核心内容及对长安销售的意义",
  "tags": ["关键词1", "关键词2"]
}

如果不相关，返回：{"relevant": false}`;

    try {
        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: systemPrompt,
                text: `标题：${item.title}\n摘要：${item.snippet}\n来源：${item.source}`,
            }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const content: string = data.output?.choices?.[0]?.message?.content || '';

        // 尝试解析 JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.relevant) return null;

        // 映射 type 字符串到 NewsType enum
        const typeMap: Record<string, NewsType> = {
            launch: NewsType.LAUNCH_PHYSICAL,
            sales: NewsType.MARKET_SALES,
            price: NewsType.COMPETITOR_TACTICS,
            channel: NewsType.NETWORK_SERVICE,
            corp: NewsType.CORP_STRATEGY,
            policy: NewsType.POLICY,
            tech: NewsType.TECH_OTA,
            other: NewsType.OTHER,
        };

        return {
            id: uid(),
            brand: parsed.brand || '其他品牌',
            date: item.date,
            type: typeMap[parsed.type] || NewsType.OTHER,
            title: item.title,
            summary: parsed.summary || item.snippet,
            tags: parsed.tags || [],
            url: item.url,
            source: item.source,
        } as NewsItem;

    } catch (err) {
        console.error('[rssService] qwenExtract failed:', err);
        return null;
    }
}

/**
 * 主函数：拉取 RSS → AI 筛选 → 返回结构化结果
 * onProgress: 每处理一条会回调，用于更新进度条
 */
export async function fetchAndScreenRSS(
    days: number = 3,
    onProgress?: (current: number, total: number, title: string) => void
): Promise<RSSFetchResult> {

    // 1. 拉取原始 RSS
    const rssRes = await fetch(`/api/rss?days=${days}`);
    if (!rssRes.ok) throw new Error('RSS 服务请求失败');
    const { items }: { items: RawRSSItem[] } = await rssRes.json();

    if (!items || items.length === 0) {
        return { imported: [], skipped: 0, total: 0 };
    }

    // 2. 逐条 AI 筛选（串行以避免 API 超限）
    const imported: NewsItem[] = [];
    let skipped = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        onProgress?.(i + 1, items.length, item.title);

        const result = await qwenExtract(item);
        if (result) {
            imported.push(result);
        } else {
            skipped++;
        }

        // 避免连续请求过快
        await new Promise(r => setTimeout(r, 300));
    }

    return { imported, skipped, total: items.length };
}

/**
 * 每日简报生成：取最近的 items 调用 /api/digest
 */
export async function generateDailyDigest(items: NewsItem[]): Promise<string> {
    const res = await fetch('/api/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });

    if (!res.ok) throw new Error('简报生成失败');
    const data = await res.json();
    return data.digest || '暂无内容';
}
