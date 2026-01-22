import * as cheerio from 'cheerio';

// 阿联酋主流汽车新闻 RSS 源配置
const RSS_SOURCES = [
  { name: 'DriveArabia', url: 'https://www.drivearabia.com/news/feed/' },
  { name: 'Gulf News Auto', url: 'https://gulfnews.com/rss/business/auto' },
  { name: 'YallaMotor', url: 'https://uae.yallamotor.com/car-news/rss' },
  { name: 'Khaleej Times', url: 'https://www.khaleejtimes.com/business/auto.xml' }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. 获取时间过滤参数 (默认为 7 天)
    const daysParam = parseInt(req.query.days) || 7;
    const cutoffTime = Date.now() - (daysParam * 24 * 60 * 60 * 1000);

    // 并行请求所有 RSS 源
    const feedPromises = RSS_SOURCES.map(async (source) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

        // 核心修复：模拟真实浏览器 Header
        const response = await fetch(source.url, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`RSS Source ${source.name} blocked: ${response.status}`);
            return [];
        }
        
        const xmlText = await response.text();

        // 使用 Cheerio 解析 XML
        const $ = cheerio.load(xmlText, { xmlMode: true });
        const items = [];

        // 遍历 feed items
        $('item').each((i, el) => {
          // 放宽抓取深度到 20 条，确保在"最近3天"新闻很多时也能覆盖到
          if (i >= 20) return; 

          const pubDateStr = $(el).find('pubDate').text().trim();
          const itemTime = new Date(pubDateStr).getTime();

          // 核心逻辑：严格的时间过滤
          if (isNaN(itemTime) || itemTime < cutoffTime) {
              return; // 如果早于截止时间，跳过
          }

          const title = $(el).find('title').text().trim();
          const link = $(el).find('link').text().trim();
          const description = $(el).find('description').text().replace(/<[^>]*>?/gm, '').substring(0, 100);

          if (title && link) {
            items.push({
              source: source.name,
              title,
              link,
              pubDate: new Date(itemTime).toISOString().split('T')[0],
              rawDate: itemTime,
              description
            });
          }
        });

        return items;
      } catch (err) {
        console.error(`Failed to fetch RSS from ${source.name}:`, err.message);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    
    // 扁平化数组并按时间倒序排列
    const allFeeds = results.flat().sort((a, b) => b.rawDate - a.rawDate);

    return res.status(200).json({ 
        success: true, 
        timeRange: `${daysParam} days`,
        count: allFeeds.length,
        items: allFeeds 
    });

  } catch (error) {
    console.error("RSS Aggregation Error:", error);
    return res.status(500).json({ error: "RSS 聚合服务暂时不可用" });
  }
}
