import * as cheerio from 'cheerio';

// ── 固定 RSS 源（中东汽车专业媒体）──────────────────────────────────
const FIXED_SOURCES = [
  { name: 'DriveArabia', url: 'https://www.drivearabia.com/news/feed/' },
  { name: 'Gulf News Auto', url: 'https://gulfnews.com/rss/business/auto' },
  { name: 'YallaMotor', url: 'https://uae.yallamotor.com/car-news/rss' },
  { name: 'Khaleej Times', url: 'https://www.khaleejtimes.com/business/auto.xml' },
];

// ── Nitter RSS（品牌官方 X 账号，仅追踪认证品牌账号）────────────────
// 使用多实例 fallback，任意一个可用即可
const NITTER_INSTANCES = [
  'https://nitter.privacydev.net',
  'https://nitter.42l.fr',
  'https://nitter.cz',
];

// 只收录经过认证的品牌官方 X 账号
const OFFICIAL_X_ACCOUNTS = [
  { brand: 'BYD', handle: 'BYDGlobal' },
  { brand: 'BYD UAE', handle: 'BYDAutoUAE' },
  { brand: 'Toyota', handle: 'Toyota' },
  { brand: 'Hyundai', handle: 'Hyundai_Global' },
  { brand: 'Kia', handle: 'Kia_Worldwide' },
  { brand: 'MG Motor', handle: 'mgmotor' },
  { brand: 'GWM', handle: 'gwm_global' },
  { brand: 'Changan', handle: 'ChanganAutoGroup' },
  { brand: 'Jetour', handle: 'JetourOfficial' },
];

// 随机选一个 Nitter 实例（负载分散）
const toNitterRSS = (handle, brand) => ({
  name: `X官号: @${handle} (${brand})`,
  url: `${NITTER_INSTANCES[Math.floor(Math.random() * NITTER_INSTANCES.length)]}/${handle}/rss`,
  isNitter: true,
});

const NITTER_SOURCES = OFFICIAL_X_ACCOUNTS.map(a => toNitterRSS(a.handle, a.brand));

// ── Google News RSS 关键词（按品牌 + 主题分组）──────────────────────
const GOOGLE_NEWS_KEYWORDS = [
  // 长安（重点追踪）
  'Changan car UAE',
  'Changan Lamore UAE',
  'Changan Uni UAE',
  'Changan Deepal UAE',
  'Changan electric UAE',

  // BYD
  'BYD UAE price',
  'BYD Atto UAE',
  'BYD Han UAE',
  'BYD electric discount UAE',
  'BYD Al-Futtaim UAE',

  // 日韩传统品牌
  'Toyota UAE 2025',
  'Toyota price drop UAE',
  'Hyundai Tucson UAE',
  'Kia Sportage UAE',
  'Nissan UAE launch',

  // MG (上汽) - 在中东销量极大
  'MG Motor UAE',
  'MG Whale UAE',
  'MG 7 UAE launch',
  'MG price offer Dubai',

  // Geely & Zeekr (吉利系)
  'Geely UAE price',
  'Geely Monjaro UAE',
  'Zeekr UAE AW Rostamani',
  'Zeekr 001 Dubai',

  // Chery & Sub-brands (奇瑞系 - Omoda/Jaecoo/Exeed)
  'Chery UAE Tiggo',
  'Omoda UAE launch',
  'Jaecoo UAE price',
  'Exeed UAE luxury',

  // GWM (长城系 - Haval/Tank)
  'Haval UAE SUV',
  'Tank 500 UAE',
  'GWM Ora UAE',

  // GAC & Aion (广汽系)
  'GAC Motor UAE Gargash',
  'GAC Aion electric UAE',

  // New Energy / Luxury (新势力 & 豪华)
  'Hongqi UAE luxury',
  'Xpeng UAE launch',
  'NIO UAE electric',
  'Polestar UAE price',

  // 价格/促销专项
  'car price reduction UAE 2025',
  'car discount offer UAE',
  'SUV promotion UAE Ramadan',
  'automobile price UAE 2025',
  'car deal UAE limited offer',

  // 市场动态
  'UAE auto market sales 2025',
  'UAE car registration 2025',
  'UAE electric vehicle charging',
  'UAE EV policy subsidy',
  'Dubai car expo 2025',

  // 中国品牌大类
  'Chinese car brand Middle East',
  'China automobile GCC 2025',
  'new SUV launch UAE 2025',
  'best selling car UAE 2025',
];

const toGoogleNewsRSS = (keyword) => {
  const q = encodeURIComponent(keyword);
  return {
    name: `Google News: ${keyword}`,
    url: `https://news.google.com/rss/search?q=${q}&hl=en&gl=AE&ceid=AE:en`,
  };
};

const ALL_SOURCES = [
  ...FIXED_SOURCES,
  ...NITTER_SOURCES,
  ...GOOGLE_NEWS_KEYWORDS.map(toGoogleNewsRSS),
];

// ── 获取单个 RSS 源 ──────────────────────────────────────────────────
async function fetchSingleRSS(source, cutoffTime) {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: controller.signal,
    });
    clearTimeout(tid);

    if (!response.ok) {
      console.warn(`RSS blocked: ${source.name} → HTTP ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = [];

    $('item').each((i, el) => {
      if (i >= 25) return; // 每源最多取 25 条

      const pubDateStr = $(el).find('pubDate').text().trim();
      const pubTime = new Date(pubDateStr).getTime();
      if (isNaN(pubTime) || pubTime < cutoffTime) return;

      const title = $(el).find('title').text().trim()
        .replace(/\s*<!\[CDATA\[|\]\]>/g, ''); // 去掉 CDATA 标记
      const link = $(el).find('link').text().trim() ||
        $(el).find('link').attr('href') || '';
      const desc = $(el).find('description').text()
        .replace(/<[^>]*>?/gm, '').substring(0, 150).trim();

      if (title && link) {
        items.push({
          source: source.name,
          title,
          url: link,
          date: new Date(pubTime).toISOString().split('T')[0],
          rawDate: pubTime,
          snippet: desc,
        });
      }
    });

    return items;
  } catch (err) {
    console.error(`Fetch failed [${source.name}]:`, err.message);
    return [];
  }
}

// ── Vercel 函数入口 ──────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const days = parseInt(req.query.days) || 7;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // 并行拉取所有源（固定 + Google News）
    const results = await Promise.all(
      ALL_SOURCES.map(src => fetchSingleRSS(src, cutoffTime))
    );

    // 合并去重（按 title 去重）
    const seen = new Set();
    const allItems = results.flat().filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    }).sort((a, b) => b.rawDate - a.rawDate);

    return res.status(200).json({
      success: true,
      timeRange: `${days}d`,
      count: allItems.length,
      items: allItems,
    });

  } catch (err) {
    console.error('RSS handler error:', err);
    return res.status(500).json({ error: 'RSS 服务暂不可用，请稍后重试' });
  }
}
