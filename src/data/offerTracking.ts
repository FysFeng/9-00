export type OfferLogic = 'AND' | 'OR' | 'AND + OR' | 'PRICE_ONLY' | 'SIMPLE';

export type OfferChangeType =
  | 'PRICE_DOWN'
  | 'EMI_UP'
  | 'BENEFIT_ADDED'
  | 'BENEFIT_CLARIFIED'
  | 'NEW_MODEL'
  | 'NO_PUBLIC_CHANGE';

export interface CurrentOffer {
  id: string;
  brand: string;
  model: string;
  startingEmi: string;
  startingPrice: string;
  offerLogic: OfferLogic;
  mainOffer: string;
  sourceStatus: string;
  updatedAt: string;
  details: {
    finance?: string;
    insurance?: string;
    registration?: string;
    service?: string;
    warranty?: string;
    roadside?: string;
    tinting?: string;
    charging?: string;
    fuel?: string;
    cashDiscount?: string;
    deferredPayment?: string;
    optionA?: string;
    optionB?: string;
    note?: string;
  };
}

export interface OfferChange {
  id: string;
  date: string;
  brand: string;
  model: string;
  changeType: OfferChangeType;
  previousValue: string;
  currentValue: string;
  impact: string;
  source: string;
}

export const currentOffers: CurrentOffer[] = [
  {
    id: 'byd-seal-7',
    brand: 'BYD',
    model: 'SEAL 7',
    startingEmi: 'AED 1,599/月',
    startingPrice: 'AED 109,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 4年/90,000km 服务',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: {
      finance: '0% finance',
      insurance: '免费保险',
      registration: '免费注册',
      service: '4年 / 90,000km',
      note: '月供较此前记录上调 AED 100。',
    },
  },
  {
    id: 'byd-shark-6',
    brand: 'BYD',
    model: 'SHARK 6',
    startingEmi: 'AED 2,399/月',
    startingPrice: 'AED 158,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费注册 + 2年/45,000km 服务 + 免费贴膜',
    sourceStatus: '官网确认 + 人工价格',
    updatedAt: '2026-05-26',
    details: {
      finance: '0% finance',
      registration: '免费注册',
      service: '2年 / 45,000km',
      tinting: '免费贴膜',
      note: '优惠较旧记录增加 finance 和 tint。',
    },
  },
  {
    id: 'byd-sealion-5',
    brand: 'BYD',
    model: 'SEALION 5',
    startingEmi: 'AED 1,399/月',
    startingPrice: 'AED 89,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 2年/45,000km 服务',
    sourceStatus: '官网确认 + 人工价格',
    updatedAt: '2026-05-26',
    details: {
      finance: '0% finance',
      insurance: '免费保险',
      registration: '免费注册',
      service: '2年 / 45,000km',
    },
  },
  {
    id: 'jetour-t1',
    brand: 'Jetour',
    model: 'T1',
    startingEmi: 'AED 1,349/月',
    startingPrice: '-',
    offerLogic: 'OR',
    mainOffer: '0 VAT 或 3年 0% interest；6个月后付款',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: {
      optionA: '0 VAT',
      optionB: '3年 0% interest',
      warranty: '1 million km',
      deferredPayment: '6个月后付款',
      note: '0 VAT 与 0% interest 是二选一，不应合并为全部享受。',
    },
  },
  {
    id: 'haval-h9',
    brand: 'Haval',
    model: 'H9',
    startingEmi: 'AED 1,799/月',
    startingPrice: 'AED 119,900 + VAT',
    offerLogic: 'AND + OR',
    mainOffer: 'Payment protection + 金融/权益包二选一',
    sourceStatus: '人工 + 官网',
    updatedAt: '2026-05-26',
    details: {
      optionA: '3年 0% profit',
      optionB: '3年免费服务 + 免费注册 + insurance support',
      roadside: '5年',
      tinting: 'Window tinting',
      warranty: '6年 / 200,000km',
      note: '基础权益可叠加，但 Option A 和 Option B 是二选一。',
    },
  },
  {
    id: 'tank-300',
    brand: 'GWM / TANK',
    model: 'TANK 300',
    startingEmi: 'AED 1,899/月',
    startingPrice: 'AED 109,900 + VAT',
    offerLogic: 'AND',
    mainOffer: 'Payment protection + 免费保险 + 免费注册 + 5年服务 + 5年道路救援 + 3M贴膜',
    sourceStatus: '官网确认 + 人工优惠',
    updatedAt: '2026-05-26',
    details: {
      insurance: '免费保险',
      registration: '免费注册',
      service: '5年 premium service plan',
      roadside: '5年',
      tinting: '3M tinting',
      note: '官网首页价格较此前记录下降 AED 10,000。',
    },
  },
  {
    id: 'nissan-altima',
    brand: 'Nissan',
    model: 'Altima',
    startingEmi: 'AED 1,950/月',
    startingPrice: 'AED 110,500',
    offerLogic: 'AND',
    mainOffer: '5年保修 + 5年道路救援 + 5年/100,000km 服务 + 3年免费燃油',
    sourceStatus: '官网确认 + 人工月供',
    updatedAt: '2026-05-26',
    details: {
      service: '5年 / 100,000km',
      warranty: '5年',
      roadside: '5年',
      fuel: '3年免费燃油',
      note: 'Abu Dhabi 活动新增免费燃油权益。',
    },
  },
];

export const offerChanges: OfferChange[] = [
  {
    id: 'tank-300-price-down',
    date: '2026-05-26',
    brand: 'GWM / TANK',
    model: 'TANK 300',
    changeType: 'PRICE_DOWN',
    previousValue: 'AED 119,900 + VAT',
    currentValue: 'AED 109,900 + VAT',
    impact: '降价 AED 10,000，对同价位 SUV 形成更强价格压力。',
    source: 'GWM UAE',
  },
  {
    id: 'tank-500-price-down',
    date: '2026-05-26',
    brand: 'GWM / TANK',
    model: 'TANK 500',
    changeType: 'PRICE_DOWN',
    previousValue: 'AED 159,900 + VAT',
    currentValue: 'AED 149,900 + VAT',
    impact: '降价 AED 10,000，高价位硬派 SUV 竞争增强。',
    source: 'GWM UAE',
  },
  {
    id: 'byd-seal-7-emi-up',
    date: '2026-05-26',
    brand: 'BYD',
    model: 'SEAL 7',
    changeType: 'EMI_UP',
    previousValue: 'AED 1,499/月',
    currentValue: 'AED 1,599/月',
    impact: '月供上调 AED 100，但服务期限更清楚。',
    source: 'BYD UAE Offers',
  },
  {
    id: 'byd-shark-6-benefit',
    date: '2026-05-26',
    brand: 'BYD',
    model: 'SHARK 6',
    changeType: 'BENEFIT_ADDED',
    previousValue: '免费注册 + 免费服务',
    currentValue: '新增 0% finance + 免费贴膜 + 2年/45,000km 服务',
    impact: '皮卡/SUV 交叉竞争中，用车成本表达更强。',
    source: 'BYD UAE Offers',
  },
  {
    id: 'nissan-altima-fuel',
    date: '2026-05-26',
    brand: 'Nissan',
    model: 'Altima',
    changeType: 'BENEFIT_ADDED',
    previousValue: '5年服务 / 保修 / 道路救援',
    currentValue: '新增 3年免费燃油',
    impact: '降低用车成本感知，适合销售话术提醒。',
    source: 'Nissan Abu Dhabi',
  },
  {
    id: 'mitsubishi-destinator-new',
    date: '2026-05-26',
    brand: 'Mitsubishi',
    model: 'Destinator',
    changeType: 'NEW_MODEL',
    previousValue: '-',
    currentValue: 'AED 69,900 起',
    impact: 'SUV 价格带新增竞争对象。',
    source: 'Mitsubishi UAE Offers',
  },
];
