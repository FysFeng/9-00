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

type OfferRow = {
  brand: string;
  model: string;
  monthly?: string;
  price?: string;
  structure?: string;
  finance?: string;
  priceProtection?: string;
  insurance?: string;
  registration?: string;
  service?: string;
  warranty?: string;
  roadside?: string;
  tinting?: string;
  charging?: string;
  cashDiscount?: string;
  note?: string;
  url?: string;
};

const cleanOfferValue = (value?: string) => {
  if (!value || value === '-') return '';
  return value;
};

const brandUrl = (brand: string) => {
  if (brand.includes('BYD')) return 'https://www.byduae.ae/en/';
  if (brand.includes('Jetour')) return 'https://jetouruae.com/';
  if (brand.includes('Toyota')) return 'https://www.toyota.ae/';
  if (brand.includes('GWM')) return 'https://www.gwmuae.com/';
  if (brand.includes('Nissan')) return 'https://en.nissan-dubai.com/';
  if (brand.includes('Mitsubishi')) return 'https://www.mitsubishi-motors.ae/';
  return '';
};

const offerRows: OfferRow[] = [
  { brand: 'BYD 比亚迪', model: 'Ti 7', structure: 'AND', insurance: '免费保险', registration: '免费注册' },
  { brand: 'BYD 比亚迪', model: 'SEAL 7', monthly: 'AED 1,499/月', price: '109,900', structure: 'AND', finance: '金融支持', insurance: '免费保险', registration: '免费注册', service: '免费保养' },
  { brand: 'BYD 比亚迪', model: 'SONG PLUS', monthly: 'AED 1,699/月', price: '119,900', structure: 'AND', finance: '金融支持', insurance: '免费保险', registration: '免费注册', service: '免费保养' },
  { brand: 'BYD 比亚迪', model: 'SHARK 6', monthly: 'AED 2,399/月', price: '158,900', structure: 'AND', insurance: '免费保险', registration: '免费注册', service: '免费保养' },
  { brand: 'BYD 比亚迪', model: 'SEALION 7', monthly: 'AED 2,199/月', structure: 'AND', finance: '金融支持', insurance: '免费保险', registration: '免费注册', service: '免费保养', charging: '1年 ADNOC charging' },
  { brand: 'BYD 比亚迪', model: 'SEALION 5', monthly: 'AED 1,399/月', price: '89,900', structure: 'AND', insurance: '免费保险', registration: '免费注册', service: '免费保养' },
  { brand: 'BYD 比亚迪', model: 'SEAL', monthly: 'AED 1,999/月', structure: 'AND', finance: '金融支持', insurance: '免费保险', registration: '免费注册', service: '免费保养', charging: '1年 ADNOC charging' },
  { brand: 'BYD 比亚迪', model: 'QIN PLUS', monthly: 'AED 1,099/月', price: '74,900', structure: 'AND', finance: '金融支持', insurance: '免费保险', registration: '免费注册', service: '免费保养' },
  { brand: 'BYD 比亚迪', model: 'ATTO 8', monthly: 'AED 2,399/月', price: '159,900', structure: 'AND', insurance: '免费保险', registration: '免费注册', service: '免费保养' },
  { brand: 'BYD 比亚迪', model: 'HAN', monthly: 'AED 2,699/月', structure: 'AND', finance: '金融支持', insurance: '免费保险', registration: '免费注册', service: '免费保养', charging: '家庭充电权益' },
  { brand: 'BYD 比亚迪', model: 'SEAL 6', monthly: 'AED 1,299/月', price: '87,900', structure: 'AND', registration: '免费注册', service: '免费保养' },
  { brand: 'Jetour 捷途', model: 'T1', monthly: 'AED 1,349/月', structure: 'OR', finance: '3年保险或 VAT 支持', service: '3年 / 30,000 km service package', warranty: '10年 / 1,000,000 km', note: '6个月后付款' },
  { brand: 'Jetour 捷途', model: 'G700', monthly: 'AED 2,499/月', price: '169,000', structure: 'OR', finance: '3年保险或 VAT 支持', warranty: '1,000,000 km', note: '6个月后付款' },
  { brand: 'Jetour 捷途', model: 'T2', monthly: 'AED 1,899/月', structure: 'OR', finance: '3年保险或 VAT 支持', service: '3年 / 30,000 km service package', warranty: '10年 / 1,000,000 km', note: '6个月后付款' },
  { brand: 'Toyota 丰田', model: 'Camry', monthly: 'AED 1,349/月', price: '122,900', structure: 'OR', finance: 'Option: 0% finance up to 5年', insurance: 'Option: included', registration: 'Option: included', service: 'Option: included', warranty: 'Option: extended warranty', tinting: 'Option: tinting', note: '缺少详细信息' },
  { brand: 'Toyota 丰田', model: 'Land Cruiser', monthly: 'AED 2,999/月', price: '239,900' },
  { brand: 'Toyota 丰田', model: 'Urban Cruiser', monthly: 'AED 899/月', price: '79,900', structure: 'AND', insurance: 'Included insurance', registration: 'Included registration', service: 'Included servicing', warranty: 'Extended warranty', tinting: 'Included tinting', note: '缺少详细信息' },
  { brand: 'GWM 长城', model: 'TANK 300', monthly: 'AED 1,899/月', price: '119,900 + VAT', structure: 'AND', priceProtection: 'Yes', insurance: '免费保险', registration: '免费注册', service: '5年 premium service plan', roadside: '5年', tinting: 'Free 3M tinting' },
  { brand: 'GWM 长城', model: 'TANK 500', monthly: 'AED 2,499/月', price: '159,900 + VAT', structure: 'AND', priceProtection: 'Yes', insurance: '免费保险', registration: '免费注册', service: '5年 premium service plan', roadside: '5年', tinting: 'Free 3M tinting' },
  { brand: 'GWM 长城', model: 'H7', monthly: 'AED 1,499/月', price: '99,900 + VAT', structure: 'AND + OR', finance: '3年保险或 VAT 支持', priceProtection: 'Yes', service: 'Option B: free 3年 service contract', warranty: '6年 / 200,000 km', roadside: '3-5年' },
  { brand: 'GWM 长城', model: 'H9', monthly: 'AED 1,799/月', price: '119,900 + VAT', structure: 'AND + OR', finance: '3年保险或 VAT 支持', priceProtection: 'Yes', insurance: 'Option B: insurance support', registration: 'Option B: complimentary registration', service: 'Option B: free 3年 service contract', warranty: '6年 / 200,000 km', roadside: 'Option B + 5年 official roadside', tinting: 'Option B: window tinting' },
  { brand: 'GWM 长城', model: 'Jolion Pro', monthly: 'AED 1,049/月', price: '69,900 + VAT', structure: 'AND + OR', priceProtection: 'Yes', registration: 'Option A: complimentary registration', service: 'Option A: free 3年 service contract', warranty: '6年 / 200,000 km', roadside: '5年', cashDiscount: 'Option B: AED 10,000 cash discount' },
  { brand: 'Nissan 日产', model: 'Altima', monthly: 'AED 1,950/月', price: '110,500', structure: 'AND', service: '5年 / 100,000 km', warranty: '5年', roadside: '5年' },
  { brand: 'Nissan 日产', model: 'X-Trail', monthly: 'AED 1,890/月', price: '103,900', structure: 'AND', service: '5年 / 100,000 km', warranty: '5年', roadside: '5年' },
  { brand: 'Nissan 日产', model: 'Kicks', monthly: 'AED 1,300/月', structure: 'AND', service: '3年 / 60,000 km', warranty: '5年', roadside: '5年' },
  { brand: 'Nissan 日产', model: 'Patrol', structure: 'AND', service: 'Free 5年 service', warranty: '5年', roadside: '5年' },
  { brand: 'Mitsubishi 三菱', model: 'Outlander', price: '79,900*', note: '无活动' },
];

const buildOfferSignals = (row: OfferRow): NewsItem['strategySignals'] => {
  const signals: NonNullable<NewsItem['strategySignals']> = [];
  const base = { model: row.model, currency: 'AED' };

  if (cleanOfferValue(row.price) || cleanOfferValue(row.monthly)) {
    signals.push({
      category: 'price',
      action: `${row.model} 当前报价更新`,
      ...base,
      msrp: cleanOfferValue(row.price),
      current_value: [cleanOfferValue(row.price) && `起售价 AED ${cleanOfferValue(row.price)}`, cleanOfferValue(row.monthly) && `月供 ${cleanOfferValue(row.monthly)}`].filter(Boolean).join(' / '),
      note: row.structure ? `Offer Structure: ${row.structure}` : undefined,
    });
  }

  if (cleanOfferValue(row.finance)) signals.push({ category: 'finance', action: '金融方案/付款支持', ...base, current_value: cleanOfferValue(row.finance) });
  if (cleanOfferValue(row.priceProtection)) signals.push({ category: 'price', action: '价格保护', ...base, current_value: cleanOfferValue(row.priceProtection) });
  if (cleanOfferValue(row.insurance)) signals.push({ category: 'insurance', action: '保险权益', ...base, current_value: cleanOfferValue(row.insurance) });
  if (cleanOfferValue(row.registration)) signals.push({ category: 'service', action: '注册权益', ...base, current_value: cleanOfferValue(row.registration) });
  if (cleanOfferValue(row.service)) signals.push({ category: 'service', action: '保养/服务权益', ...base, current_value: cleanOfferValue(row.service) });
  if (cleanOfferValue(row.warranty)) signals.push({ category: 'service', action: '质保权益', ...base, current_value: cleanOfferValue(row.warranty) });
  if (cleanOfferValue(row.roadside)) signals.push({ category: 'service', action: '道路救援权益', ...base, current_value: cleanOfferValue(row.roadside) });
  if (cleanOfferValue(row.tinting)) signals.push({ category: 'bundle', action: '贴膜权益', ...base, current_value: cleanOfferValue(row.tinting) });
  if (cleanOfferValue(row.charging)) signals.push({ category: 'charging', action: '充电权益', ...base, current_value: cleanOfferValue(row.charging) });
  if (cleanOfferValue(row.cashDiscount)) signals.push({ category: 'price', action: '现金折扣', ...base, current_value: cleanOfferValue(row.cashDiscount) });
  if (cleanOfferValue(row.note) && row.note !== '无活动') signals.push({ category: 'other', action: '备注', ...base, current_value: cleanOfferValue(row.note) });

  return signals;
};

const OFFER_TRACKING_NEWS: NewsItem[] = offerRows
  .map((row, index) => {
    const signals = buildOfferSignals(row);
    return {
      id: `offer-${index + 1}`,
      title: `${row.brand} ${row.model} 优惠价格更新`,
      summary: `${row.model} 已按 offer info.xlsx 更新价格与权益。${row.price ? `起售价 AED ${row.price}。` : ''}${row.monthly ? `月供 ${row.monthly}。` : ''}`,
      original_text: '',
      url: row.url || brandUrl(row.brand),
      source: 'offer info.xlsx',
      date: d(0),
      brand: row.brand,
      type: NewsType.COMPETITOR_TACTICS,
      sentiment: 'neutral' as const,
      tags: ['价格追踪', '优惠权益', row.model],
      model: row.model,
      msrp: cleanOfferValue(row.price),
      currency: 'AED',
      strategySignals: signals,
    };
  })
  .filter((item) => item.strategySignals && item.strategySignals.length > 0);

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
  ...OFFER_TRACKING_NEWS,

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
