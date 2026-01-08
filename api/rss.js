{
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

// 1. 定义媒体资源池 (映射到真实 RSS 或 Google News 聚合)
const RSS_SOURCES = [
  { 
    id: 'drive_arabia', 
    name: 'Drive Arabia', 
    url: 'https://www.drivearabia.com/news/feed/',
    type: 'direct'
  },
  { 
    id: 'yallamotor', 
    name: 'YallaMotor', 
    url: 'https://uae.yallamotor.com/car-news/rss', 
    type: 'direct' 
  },
  {
    id: 'dubicars',
    name: 'DubiCars News',
    url: 'https://www.dubicars.com/news/feed/',
    type: 'direct'
  },
  { 
    id: 'gulf_business', 
    name: 'Gulf Business (Auto)', 
    // 使用 Google News 聚合指定 Site 是一种更稳定、不易被封的策略
    url: 'https://news.google.com/rss/search?q=site:gulfbusiness.com+automotive&hl=en-AE&gl=AE&ceid=AE:en',
    type: 'aggregator'
  },
  { 
    id: 'thenational', 
    name: 'The National (Motoring)', 
    url: 'https://news.google.com/rss/search?q=site:thenationalnews.com/lifestyle/motoring&hl=en-AE&gl=AE&ceid=AE:en',
    type: 'aggregator'
  },
  {
    id: 'autodrift',
    name: 'AutoDrift AE',
    // 假设无直接 RSS，使用 Google News 搜索补救
    url: 'https://news.google.com/rss/search?q=site:autodrift.ae&hl=en-AE&gl=AE&ceid=AE:en',
    type: 'aggregator'
  }
];

// 2. 汽车行业关键词白名单 (用于综合性媒体过滤)
const AUTO_KEYWORDS = [
  'car', 'auto', 'vehicle', 'suv', 'ev', 'electric', 'hybrid', 'sedan', 
  'toyota', 'nissan', 'ford', 'bmw', 'mercedes', 'byd', 'tesla', 'jetour', 
  'changan', 'geely', 'mg', 'traffic', 'road', 'dubai police', 'rta', 
  'launch', 'drive', 'review', 'engine', 'motor'
];

// 3. 随机 User-Agent 池 (防封禁)
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
];

const getRandomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const parser = new Parser({
        timeout: 8000,
        headers: { 'User-Agent': getRandomUA() },
        customFields: {
          item: [
            ['media:content', 'mediaContent'], 
            ['media:thumbnail', 'mediaThumbnail'],
            ['enclosure', 'enclosure'],
            ['content:encoded', 'contentEncoded']
          ]
        }
    });

    const allItems = [];

    // 并行抓取，但限制并发数防止 Vercel 内存溢出（虽然这里源不多，还是安全点好）
    const fetchPromises = RSS_SOURCES.map(async (source) => {
        try {
            const feed = await parser.parseURL(source.url);
            
            feed.items.forEach(item => {
                // --- 步骤 A: 关键词过滤 ---
                const textToCheck = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
                // 如果是聚合源，必须严格检查关键词；如果是垂直源(如 Drive Arabia)，稍微放宽
                const isVertical = source.type === 'direct';
                const hasKeyword = AUTO_KEYWORDS.some(k => textToCheck.includes(k));

                if (!isVertical && !hasKeyword) return; // 丢弃无关新闻

                // --- 步骤 B: 提取图片链接 (纯解析，不请求原文) ---
                let imageUrl = '';
                
                // 1. 尝试 RSS 标准 enclosure (Podcast/Media)
                if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
                    imageUrl = item.enclosure.url;
                }
                // 2. 尝试 media:content (常见于 WordPress)
                else if (item.mediaContent && item.mediaContent.$.url) {
                    imageUrl = item.mediaContent.$.url;
                }
                // 3. 尝试 media:thumbnail
                else if (item.mediaThumbnail && item.mediaThumbnail.$.url) {
                    imageUrl = item.mediaThumbnail.$.url;
                }
                // 4. 尝试从 content:encoded HTML 中正则提取第一张 img
                else if (item.contentEncoded || item.content) {
                    const html = item.contentEncoded || item.content;
                    const $ = cheerio.load(html);
                    const firstImg = $('img').first().attr('src');
                    if (firstImg) imageUrl = firstImg;
                }

                // Google News RSS 经常返回小图，如果 url 包含 googleusercontent，尝试替换大小参数 (可选优化)
                // 但为了稳定性，暂保持原样

                allItems.push({
                    id: Buffer.from(item.link || item.title).toString('base64').substring(0, 16),
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate || new Date().toISOString(),
                    sourceName: source.name,
                    snippet: (item.contentSnippet || '').substring(0, 200) + '...',
                    imageUrl: imageUrl, // 这里只存链接，绝不下载
                    status: 'pending'
                });
            });
        } catch (err) {
            console.error(`Error fetching ${source.name}:`, err.message);
        }
    });

    await Promise.all(fetchPromises);

    // 按时间倒序，只返回最新的 40 条
    const sortedItems = allItems
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 40);

    return res.status(200).json(sortedItems);

  } catch (error) {
    console.error("RSS Handler Error:", error);
    return res.status(500).json({ error: "Feed fetch failed" });
  }
}
}
