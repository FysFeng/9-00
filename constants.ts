import { NewsType, NewsItem } from './types';

export const DEFAULT_BRANDS = [
  // 日韩传统品牌
  "Toyota 丰田",
  "Hyundai 现代",
  "Kia 起亚",
  "Nissan 日产",
  "Lexus 雷克萨斯",
  "Ford 福特",
  // 中国出海品牌
  "Changan 长安",
  "BYD 比亚迪",
  "Geely 吉利",
  "Jetour 捷途",
  "Chery 奇瑞",
  "GWM 长城",
  // 其他
  "政策相关",
  "Other 其他品牌",
];


export const NEWS_TYPES_LIST = [
  NewsType.LAUNCH_PHYSICAL,
  NewsType.TECH_OTA,
  NewsType.MARKET_SALES,
  NewsType.POLICY,
  NewsType.NETWORK_SERVICE,
  NewsType.COMPETITOR_TACTICS,
  NewsType.CORP_STRATEGY,
  NewsType.OTHER
];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  [NewsType.LAUNCH_PHYSICAL]: "新车发布",
  [NewsType.TECH_OTA]: "技术/配置",
  [NewsType.MARKET_SALES]: "销量数据",
  [NewsType.POLICY]: "政策/监管",
  [NewsType.NETWORK_SERVICE]: "售后/渠道",
  [NewsType.COMPETITOR_TACTICS]: "价格/促销",
  [NewsType.CORP_STRATEGY]: "企业动态",
  [NewsType.OTHER]: "其他"
};

// Helper to generate a random ID
const uuid = () => Math.random().toString(36).substring(2, 15);

// Initial Demo Data
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getAIImage = (prompt: string) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

// --- MOCK DATA GENERATOR ---
const d = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

export const INITIAL_NEWS: NewsItem[] = [
  // --- TOYOTA: The Incumbent (Defensive Strategy) ---
  {
    id: uuid(),
    title: "丰田宣布 2025 款 Land Cruiser 普拉多正式登陆阿联酋，保留大排量引擎",
    summary: "面对中国品牌的新能源攻势，丰田选择在旗舰车型上继续强化越野与可靠性心智。",
    original_text: "",
    url: "https://example.com/toyota-lc",
    source: "The National",
    date: d(-2),
    brand: "Toyota 丰田",
    type: NewsType.LAUNCH_PHYSICAL,
    sentiment: "positive",
    tags: ["越野", "V6引擎", "旗舰上市"]
  },
  {
    id: uuid(),
    title: "丰田推出 'Toyota Relax' 10年原厂延保计划，针对所有车龄车型",
    summary: "旨在巩固二手车残值与售后粘性，应对新兴品牌的质保战。",
    original_text: "",
    url: "https://example.com/toyota-relax",
    source: "Gulf News",
    date: d(-5),
    brand: "Toyota 丰田",
    type: NewsType.NETWORK_SERVICE,
    sentiment: "positive",
    tags: ["售后", "质保", "用户关怀"]
  },

  // --- CHANGAN: The Focus Brand ---
  {
    id: uuid(),
    title: "长安启源 E07 纯电跨界 SUV 有望年底引入阿联酋市场",
    summary: "这款聚焦科技与多功能的创新车型将填补长安全球战略中高端智能新能源产品线的空白。",
    original_text: "",
    url: "https://example.com/changan-e07",
    source: "Gulf Auto News",
    date: d(-0),
    brand: "Changan 长安",
    type: NewsType.LAUNCH_PHYSICAL,
    sentiment: "positive",
    tags: ["新车预热", "纯电", "启源E07"]
  },
  {
    id: uuid(),
    title: "阿联酋市场第三季度中国品牌销量榜，长安稳居前三",
    summary: "长安 UNI 系列的持续热销以及 CS 系列的稳定发力，帮助长安稳固了其在中东市场的基本盘。",
    original_text: "",
    url: "https://example.com/changan-sales-q3",
    source: "Middle East Business",
    date: d(-3),
    brand: "Changan 长安",
    type: NewsType.MARKET_SALES,
    sentiment: "positive",
    tags: ["销量分析", "UNI系列", "市场表现"]
  },

  // --- BYD: The Challenger (Aggressive Expansion) ---
  {
    id: uuid(),
    title: "BYD 携手 Al-Futtaim 宣布 Atto 3 价格下调 8%，直指日系紧凑级 SUV",
    summary: "这是比亚迪进入中东市场以来首次官方调价，意在加快渗透率。",
    original_text: "",
    url: "https://example.com/byd-price",
    source: "Khaleej Times",
    date: d(-1),
    brand: "BYD 比亚迪",
    type: NewsType.COMPETITOR_TACTICS,
    sentiment: "neutral",
    tags: ["价格战", "价格调整", "Atto 3"]
  },
  {
    id: uuid(),
    title: "阿布扎比警方接收首批 50 台 BYD Han EV 作为巡逻车",
    summary: "标志着中国高端电动车正式进入政府采购清单，具有极强的背书效应。",
    original_text: "",
    url: "https://example.com/byd-police",
    source: "WAM",
    date: d(-7),
    brand: "BYD 比亚迪",
    type: NewsType.CORP_STRATEGY,
    sentiment: "positive",
    tags: ["B2G", "政府采购", "品牌向上"]
  },

  // --- POLICY & MACRO (The Landscape) ---
  {
    id: uuid(),
    title: "阿联酋内阁批准 2025 新能源车辆联邦统一充电标准",
    summary: "统一使用欧标 CCS2，这将对目前使用国标/美标的平行进口车造成重大打击。",
    original_text: "",
    url: "https://example.com/uae-ev-policy",
    source: "WAM",
    date: d(-3),
    brand: "政策相关",
    type: NewsType.POLICY,
    sentiment: "neutral",
    tags: ["充电标准", "行业法规", "准入"]
  },
  {
    id: uuid(),
    title: "迪拜 RTA 宣布扩大 EV 免费停车区域至全城",
    summary: "进一步刺激电动车消费，利好所有在售 EV 品牌。",
    original_text: "",
    url: "https://example.com/dubai-parking",
    source: "RTA Official",
    date: d(-10),
    brand: "政策相关",
    type: NewsType.POLICY,
    sentiment: "positive",
    tags: ["路权", "用户福利", "EV刺激"]
  },

  // --- GEELY: Tech Play ---
  {
    id: uuid(),
    title: "吉利 Monjaro (星越L) 在迪拜举办沙漠极限测试直播",
    summary: "通过极端环境测试展示 CMA 架构的可靠性，打破消费者对中国车耐久性的顾虑。",
    original_text: "",
    url: "https://example.com/geely-test",
    source: "Car Middle East",
    date: d(-4),
    brand: "Geely 吉利",
    type: NewsType.LAUNCH_PHYSICAL, // Treated as major event
    sentiment: "positive",
    tags: ["沙漠测试", "耐久性", "营销活动"]
  },

  // --- FILLER DATA (For Charts) ---
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: uuid(),
    title: `Toyota Yaris 销量虽下滑但仍保持细分市场第一`,
    summary: "尽管受到竞品冲击，Yaris 凭借网约车市场依然坚挺。",
    original_text: "",
    url: "",
    source: "AutoData",
    date: d(-i - 1),
    brand: "Toyota 丰田",
    type: NewsType.MARKET_SALES,
    sentiment: "neutral" as const,
    tags: ["销量分析"]
  })),
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: uuid(),
    title: `Jetour 旅行者 T2 订单破千`,
    summary: "方盒子造型深受当地年轻人喜爱。",
    original_text: "",
    url: "",
    source: "Dealer Source",
    date: d(-i - 2),
    brand: "Jetour 捷途",
    type: NewsType.MARKET_SALES,
    sentiment: "positive" as const,
    tags: ["爆款", "订单战报"]
  }))
];
