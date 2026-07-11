import { NewsType, NewsItem } from './types';

export const DEFAULT_BRANDS = [
  // 中国核心出海品牌
  "Changan 长安",
  "BYD 比亚迪",
  "Geely 吉利",
  "Chery 奇瑞",
  "GWM 长城",
  "Jetour 捷途",
  // 更多中国拓展品牌
  "Changan Deepal 深蓝",
  "Changan AVATR 阿维塔",
  "Geely Zeekr 极氪",
  "Geely Lynk & Co 领克",
  "BYD DENZA 腾势",
  "Chery Exeed 星途",
  "Chery iCAUR",
  "SAIC MG 名爵",
  "Xpeng 小鹏",
  "NIO 蔚来",
  "Li Auto 理想",
  // 国际主流老牌
  "Toyota 丰田",
  "Nissan 日产",
  "Hyundai 现代",
  "Kia 起亚",
  "Ford 福特",
  "Chevrolet 雪佛兰",
  "Lexus 雷克萨斯",
  "Honda 本田",
  "Volkswagen 大众",
  "Mercedes-Benz 奔驰",
  "BMW 宝马",
  "Audi 奥迪",
  "Land Rover 路虎",
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
    tags: ["价格战", "价格调整", "Atto 3"],
    model: "Atto 3",
    msrp: "118,900",
    currency: "AED",
    strategySignals: [
      {
        category: "price",
        action: "官方展示价下探，紧凑级 EV 价格锚点前移",
        model: "Atto 3",
        msrp: "118,900",
        currency: "AED",
        previous_value: "AED 129,900",
        current_value: "AED 118,900",
        note: "展示样例：用于价格变化追踪看板",
        raw_excerpt: "Official UAE offer tracker sample"
      },
      {
        category: "finance",
        action: "配合低首付/分期金融话术强化转化",
        model: "Atto 3",
        currency: "AED",
        current_value: "低首付金融方案",
        note: "展示样例：官网优惠页监控项"
      }
    ]
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
  {
    id: uuid(),
    title: "吉利 UAE Monjaro 官方优惠价进入重点监控",
    summary: "用于演示官网价格追踪：Monjaro 展示价与金融权益同步进入竞品优惠看板。",
    original_text: "",
    url: "https://www.geely.ae/en",
    source: "Geely UAE Official Offers",
    date: d(-1),
    brand: "Geely 吉利",
    type: NewsType.COMPETITOR_TACTICS,
    sentiment: "neutral",
    tags: ["价格追踪", "官方优惠", "Monjaro"],
    model: "Monjaro",
    msrp: "137,900",
    currency: "AED",
    strategySignals: [
      {
        category: "price",
        action: "旗舰 SUV 展示价下修，压缩同级燃油 SUV 价格带",
        model: "Monjaro",
        msrp: "137,900",
        currency: "AED",
        previous_value: "AED 149,900",
        current_value: "AED 137,900",
        note: "展示样例：基于 Geely UAE 官方优惠页监控",
        raw_excerpt: "Official UAE offer tracker sample"
      },
      {
        category: "bundle",
        action: "叠加保养/质保权益，提升落地价值感",
        model: "Monjaro",
        currency: "AED",
        current_value: "保养权益包",
        note: "展示样例：官网优惠页监控项"
      }
    ]
  },
  {
    id: uuid(),
    title: "BYD UAE Sealion 7 进入限时权益追踪",
    summary: "用于演示官网价格追踪：Sealion 7 以金融方案和保险权益形成促销组合。",
    original_text: "",
    url: "https://www.byduae.ae/en/",
    source: "BYD UAE Official Offers",
    date: d(-2),
    brand: "BYD 比亚迪",
    type: NewsType.COMPETITOR_TACTICS,
    sentiment: "neutral",
    tags: ["价格追踪", "限时权益", "Sealion 7"],
    model: "Sealion 7",
    msrp: "169,900",
    currency: "AED",
    strategySignals: [
      {
        category: "insurance",
        action: "新增首年保险权益，降低首年拥车成本",
        model: "Sealion 7",
        msrp: "169,900",
        currency: "AED",
        previous_value: "无首年保险",
        current_value: "首年保险权益",
        note: "展示样例：基于 BYD UAE 官方优惠页监控"
      },
      {
        category: "finance",
        action: "月供门槛下探，强化新能源 SUV 转化",
        model: "Sealion 7",
        currency: "AED",
        previous_value: "AED 3,250/月",
        current_value: "AED 2,890/月",
        note: "展示样例：价格/金融组合促销"
      }
    ]
  },
  {
    id: uuid(),
    title: "iCAUR UAE V27 REEV 官方优惠进入奇瑞体系追踪",
    summary: "用于演示官网价格追踪：iCAUR 作为奇瑞体系新能源越野品牌，V27 REEV 进入促销变化监控。",
    original_text: "",
    url: "https://icauruae.com/",
    source: "iCAUR UAE Official Offers",
    date: d(-3),
    brand: "Chery iCAUR",
    type: NewsType.COMPETITOR_TACTICS,
    sentiment: "neutral",
    tags: ["价格追踪", "REEV", "官方优惠"],
    model: "V27 REEV",
    msrp: "139,900",
    currency: "AED",
    strategySignals: [
      {
        category: "price",
        action: "预售展示价下探，强化增程越野 SUV 入门吸引力",
        model: "V27 REEV",
        msrp: "139,900",
        currency: "AED",
        previous_value: "AED 149,900",
        current_value: "AED 139,900",
        note: "展示样例：基于 iCAUR UAE 官方优惠页监控"
      },
      {
        category: "trade_in",
        action: "置换补贴加入报价口径，推动燃油 SUV 用户转化",
        model: "V27 REEV",
        currency: "AED",
        current_value: "AED 5,000 置换补贴",
        note: "展示样例：价格/置换组合促销"
      }
    ]
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
