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
    const systemPrompt = `你是长安及中国汽车品牌出海中东业务的资深商业情报分析师。
你的任务是评估输入的新闻是否对"阿联酋及海湾国家汽车市场"有直接的商业价值，并从中提取结构化情报。

【核心过滤规则】 (Noise Filter)
若新闻仅属于以下宏观事件但对阿联酋无**直接业务影响**，必须判定为不相关 (relevant: false)：
- 某品牌在欧美/南美的建厂或工会罢工
- 欧美针对中国电动车的关税与贸易摩擦
- 纯粹的公司高管家常或花边新闻

如果新闻与中东汽车市场高度相关（如新车引入、当地定价策略、区域政策、售后网络、当地销量），请严格按照以下 JSON 格式返回分析结果（必须是合法的 JSON，不要返回 markdown 标记）：

{
  "relevant": true,
  "brand": "必须从预设列表中选择最接近的一个。预设列表：['Changan 长安', 'BYD 比亚迪', 'Geely 吉利', 'Jetour 捷途', 'Chery 奇瑞', 'GWM 长城', 'Toyota 丰田', 'Nissan 日产', 'Hyundai 现代', 'Kia 起亚', 'Ford 福特', 'Lexus 雷克萨斯', '政策相关', 'Other 其他品牌']。如果提到子品牌（如欧萌达、星途，请映射为 Chery 奇瑞；极氪映射为 Geely 吉利）。",
  "chineseTitle": "必须是中文，15字以内的精炼标题，用中文翻译并压缩原标题成信息密度最高的一句话，包含品牌名，例：'BYD在迪拜推出Seal纯电轿车'",
  "type": "必须严格是以下枚举值之一：'Launch (Physical)' | 'Tech & OTA' | 'Market & Sales' | 'Policy' | 'Network & Service' | 'Competitor Tactics' | 'Corp Strategy' | 'Other'",
  "summary": "采用'So What'分析法，用一两句话总结，格式必须为：[事实描述] + [对长安或阿联酋市场的直接业务影响]。语言必须客观商业化，禁止使用浮夸词汇（如：惨烈作战等）。",
  "tags": ["提取1-2个核心业务关键词，如 '价格战', '纯电引入', '旗舰降价'"]
}

如果新闻与中东市场无关，直接返回：{"relevant": false}`;

    try {
        const res = await fetch('/api/ai?action=analyze', {
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

        // 验证 Qwen 返回的 type 是否是合法的 NewsType 枚举值，否则兜底为 Other
        const parsedType = Object.values(NewsType).includes(parsed.type as NewsType)
            ? (parsed.type as NewsType)
            : NewsType.OTHER;

        return {
            id: uid(),
            brand: parsed.brand || 'Other 其他品牌',
            date: item.date,
            type: parsedType,
            title: parsed.chineseTitle || item.title,  // 优先显示中文标题
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
    const rssRes = await fetch(`/api/collect?action=rss&days=${days}`);
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
    const res = await fetch('/api/ai?action=digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });

    if (!res.ok) throw new Error('简报生成失败');
    const data = await res.json();
    return data.digest || '暂无内容';
}
