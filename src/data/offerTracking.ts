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
    id: 'byd-ti-7',
    brand: 'BYD',
    model: 'Ti 7',
    startingEmi: '-',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '免费注册 + 免费保险；意向登记',
    sourceStatus: '用户提供',
    updatedAt: '2026-05-26',
    details: { insurance: '免费保险', registration: '免费注册', note: 'Launch interest registration campaign.' },
  },
  {
    id: 'byd-seal-7',
    brand: 'BYD',
    model: 'SEAL 7',
    startingEmi: 'AED 1,599/mo',
    startingPrice: 'AED 109,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 4年/90,000km 服务',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '4 years / 90,000 km', note: 'EMI increased from AED 1,499/mo.' },
  },
  {
    id: 'byd-song-plus',
    brand: 'BYD',
    model: 'SONG PLUS',
    startingEmi: 'AED 1,699/mo',
    startingPrice: 'AED 119,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 免费服务',
    sourceStatus: '用户补充价格 + 官网优惠',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '免费服务' },
  },
  {
    id: 'byd-shark-6',
    brand: 'BYD',
    model: 'SHARK 6',
    startingEmi: 'AED 2,399/mo',
    startingPrice: 'AED 158,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费注册 + 2年/45,000km 服务 + 免费贴膜',
    sourceStatus: '官网确认 + 用户补充价格',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', registration: '免费注册', service: '2 years / 45,000 km', tinting: '免费贴膜' },
  },
  {
    id: 'byd-sealion-7',
    brand: 'BYD',
    model: 'SEALION 7',
    startingEmi: 'AED 2,199/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 免费服务 + 1-year ADNOC charging',
    sourceStatus: '用户提供',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '免费服务', charging: '1-year ADNOC charging' },
  },
  {
    id: 'byd-sealion-5',
    brand: 'BYD',
    model: 'SEALION 5',
    startingEmi: 'AED 1,399/mo',
    startingPrice: 'AED 89,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 2年/45,000km 服务',
    sourceStatus: '官网确认 + 用户补充价格',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '2 years / 45,000 km' },
  },
  {
    id: 'byd-seal',
    brand: 'BYD',
    model: 'SEAL',
    startingEmi: 'AED 1,999/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 免费服务 + 1-year ADNOC charging',
    sourceStatus: '用户提供',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '免费服务', charging: '1-year ADNOC charging' },
  },
  {
    id: 'byd-qin-plus',
    brand: 'BYD',
    model: 'QIN PLUS',
    startingEmi: 'AED 1,099/mo',
    startingPrice: 'AED 74,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 免费服务',
    sourceStatus: '用户补充价格 + 官网优惠',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '免费服务' },
  },
  {
    id: 'byd-atto-8',
    brand: 'BYD',
    model: 'ATTO 8',
    startingEmi: 'AED 2,399/mo',
    startingPrice: 'AED 159,900',
    offerLogic: 'AND',
    mainOffer: '免费注册 + 3年/65,000km 服务',
    sourceStatus: '官网确认 + 用户补充价格',
    updatedAt: '2026-05-26',
    details: { registration: '免费注册', service: '3 years / 65,000 km' },
  },
  {
    id: 'byd-han',
    brand: 'BYD',
    model: 'HAN',
    startingEmi: 'AED 2,699/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '0% finance + 免费保险 + 免费注册 + 免费服务 + free home charger',
    sourceStatus: '用户提供',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: '免费保险', registration: '免费注册', service: '免费服务', charging: '免费家用充电桩' },
  },
  {
    id: 'byd-seal-6',
    brand: 'BYD',
    model: 'SEAL 6',
    startingEmi: 'AED 1,399/mo',
    startingPrice: 'AED 87,900',
    offerLogic: 'AND',
    mainOffer: '免费注册 + 2年/45,000km 服务',
    sourceStatus: '官网确认 + 用户补充价格',
    updatedAt: '2026-05-26',
    details: { registration: '免费注册', service: '2 years / 45,000 km', note: '官网当前月供显示 AED 1,399/月。' },
  },
  {
    id: 'jetour-t1',
    brand: 'Jetour',
    model: 'T1',
    startingEmi: 'AED 1,349/mo',
    startingPrice: '-',
    offerLogic: 'OR',
    mainOffer: '0 VAT OR 3年0% interest；6个月后付款',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { optionA: '0 VAT', optionB: '0% interest for 3 years', warranty: '1 million km', deferredPayment: 'Pay after 6 months', note: '0 VAT and 0% interest are alternative choices.' },
  },
  {
    id: 'jetour-g700',
    brand: 'Jetour',
    model: 'G700',
    startingEmi: 'AED 2,499/mo',
    startingPrice: 'AED 169,000',
    offerLogic: 'OR',
    mainOffer: '0 VAT OR 3年0% interest；6个月后付款',
    sourceStatus: '用户补充价格 + 官网月供',
    updatedAt: '2026-05-26',
    details: { optionA: '0 VAT', optionB: '0% interest for 3 years', warranty: '1 million km', deferredPayment: 'Pay after 6 months' },
  },
  {
    id: 'jetour-t2',
    brand: 'Jetour',
    model: 'T2',
    startingEmi: 'AED 1,899/mo',
    startingPrice: '-',
    offerLogic: 'OR',
    mainOffer: '0 VAT OR 3年0% interest；6个月后付款',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { optionA: '0 VAT', optionB: '0% interest for 3 years', warranty: '1 million km', deferredPayment: 'Pay after 6 months' },
  },
  {
    id: 'toyota-camry',
    brand: 'Toyota',
    model: 'Camry',
    startingEmi: 'AED 1,349/mo',
    startingPrice: 'AED 122,900',
    offerLogic: 'OR',
    mainOffer: '全包权益方案 OR 最高5年0% finance OR 租赁方案',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { optionA: 'Service + extended warranty + tinting + registration package', optionB: '0% finance up to 5 years', note: 'Choose-your-offer structure.' },
  },
  {
    id: 'toyota-land-cruiser',
    brand: 'Toyota',
    model: 'Land Cruiser',
    startingEmi: 'AED 2,999/mo',
    startingPrice: 'AED 239,900',
    offerLogic: 'SIMPLE',
    mainOffer: '月供优惠；官网未公开更多权益',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { note: 'Offer page did not clearly list additional benefits.' },
  },
  {
    id: 'toyota-urban-cruiser',
    brand: 'Toyota',
    model: 'Urban Cruiser',
    startingEmi: 'AED 899/mo',
    startingPrice: 'AED 79,900',
    offerLogic: 'AND',
    mainOffer: '保险 + 服务 + 延保 + 贴膜 + 注册',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { insurance: '已包含', registration: '已包含', service: '已包含 servicing', warranty: '延保', tinting: '已包含' },
  },
  {
    id: 'tank-300',
    brand: 'GWM / TANK',
    model: 'TANK 300',
    startingEmi: 'AED 1,899/mo',
    startingPrice: 'AED 109,900 + VAT',
    offerLogic: 'AND',
    mainOffer: 'Payment protection + 免费保险 + 免费注册 + 5年服务 + 5年道路救援 + 3M贴膜',
    sourceStatus: '官网价格 + 用户提供优惠',
    updatedAt: '2026-05-26',
    details: { insurance: '免费保险', registration: '免费注册', service: '5-year premium service plan', roadside: '5 years', tinting: '3M tinting', note: '起步价下调 AED 10,000。' },
  },
  {
    id: 'tank-500',
    brand: 'GWM / TANK',
    model: 'TANK 500',
    startingEmi: 'AED 2,499/mo',
    startingPrice: 'AED 149,900 + VAT',
    offerLogic: 'AND',
    mainOffer: 'Payment protection + 免费保险 + 免费注册 + 5年服务 + 5年道路救援 + 3M贴膜',
    sourceStatus: '官网价格 + 用户提供优惠',
    updatedAt: '2026-05-26',
    details: { insurance: '免费保险', registration: '免费注册', service: '5-year premium service plan', roadside: '5 years', tinting: '3M tinting', note: '起步价下调 AED 10,000。' },
  },
  {
    id: 'haval-h7',
    brand: 'Haval',
    model: 'H7',
    startingEmi: 'AED 1,499/mo',
    startingPrice: 'AED 99,900 + VAT',
    offerLogic: 'AND + OR',
    mainOffer: 'Payment protection + 3年0% profit OR 免费3年service contract',
    sourceStatus: '用户优惠 + 官网价格',
    updatedAt: '2026-05-26',
    details: { optionA: '0% profit for 3 years', optionB: 'Free 3-year service contract', warranty: '6 years / 200,000 km', roadside: '3-5 years' },
  },
  {
    id: 'haval-h9',
    brand: 'Haval',
    model: 'H9',
    startingEmi: 'AED 1,799/mo',
    startingPrice: 'AED 119,900 + VAT',
    offerLogic: 'AND + OR',
    mainOffer: 'Payment protection + 0% profit OR 服务权益包（含注册与支持权益）',
    sourceStatus: '用户优惠 + 官网价格',
    updatedAt: '2026-05-26',
    details: { optionA: '0% profit for 3 years', optionB: 'Free 3-year service + complimentary registration + insurance support', warranty: '6 years / 200,000 km', roadside: '5 years', tinting: 'Window tinting' },
  },
  {
    id: 'haval-jolion-pro',
    brand: 'Haval',
    model: 'Jolion Pro',
    startingEmi: 'AED 1,049/mo',
    startingPrice: 'AED 69,900 + VAT',
    offerLogic: 'AND + OR',
    mainOffer: 'Payment protection + 免费3年服务和注册 OR AED 10,000现金优惠',
    sourceStatus: '用户优惠 + 官网价格',
    updatedAt: '2026-05-26',
    details: { optionA: 'Free 3-year service contract + complimentary registration', optionB: 'AED 10,000 cash discount', warranty: '6 years / 200,000 km', roadside: '5 years' },
  },
  {
    id: 'nissan-altima',
    brand: 'Nissan',
    model: 'Altima',
    startingEmi: 'AED 1,950/mo',
    startingPrice: 'AED 110,500',
    offerLogic: 'AND',
    mainOffer: '5年保修 + 5年道路救援 + 5年/100,000km 服务 + 3年免费燃油',
    sourceStatus: '官网确认 + 用户补充月供',
    updatedAt: '2026-05-26',
    details: { service: '5 years / 100,000 km', warranty: '5 years', roadside: '5 years', fuel: '3 years free fuel' },
  },
  {
    id: 'nissan-x-trail',
    brand: 'Nissan',
    model: 'X-Trail',
    startingEmi: 'AED 1,890/mo',
    startingPrice: 'AED 103,900',
    offerLogic: 'AND',
    mainOffer: '5年保修 + 5年道路救援 + 5年/100,000km 服务 + 最高3年免费燃油',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { service: '5 years / 100,000 km', warranty: '5 years', roadside: '5 years', fuel: 'Up to 3 years free fuel' },
  },
  {
    id: 'nissan-kicks',
    brand: 'Nissan',
    model: 'Kicks',
    startingEmi: 'AED 1,300/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '5年保修 + 5年道路救援 + 3年/60,000km 服务',
    sourceStatus: '用户提供',
    updatedAt: '2026-05-26',
    details: { service: '3 years / 60,000 km', warranty: '5 years', roadside: '5 years' },
  },
  {
    id: 'nissan-patrol',
    brand: 'Nissan',
    model: 'Patrol',
    startingEmi: '-',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '免费5年服务 + 5年保修 + 5年道路救援',
    sourceStatus: '用户提供',
    updatedAt: '2026-05-26',
    details: { service: '免费5年服务', warranty: '5 years', roadside: '5 years' },
  },
  ...[
    ['mitsubishi-asx', 'ASX', 'AED 59,900*'],
    ['mitsubishi-xpander', 'Xpander', 'AED 60,900*'],
    ['mitsubishi-eclipse-cross', 'Eclipse Cross', 'AED 63,900*'],
    ['mitsubishi-outlander', 'Outlander', 'AED 79,900*'],
    ['mitsubishi-montero-sport', 'Montero Sport', 'AED 96,900*'],
    ['mitsubishi-destinator', 'Destinator', 'AED 69,900'],
  ].map(([id, model, price]) => ({
    id,
    brand: 'Mitsubishi',
    model,
    startingEmi: '-',
    startingPrice: price,
    offerLogic: 'PRICE_ONLY' as OfferLogic,
    mainOffer: 'SUV阵容起步价',
    sourceStatus: '官网确认',
    updatedAt: '2026-05-26',
    details: { note: 'Price-only offer; no clear finance/service bundle found.' },
  })),
];

export const offerChanges: OfferChange[] = [
  { id: 'tank-300-price-down', date: '2026-05-26', brand: 'GWM / TANK', model: 'TANK 300', changeType: 'PRICE_DOWN', previousValue: 'AED 119,900 + VAT', currentValue: 'AED 109,900 + VAT', impact: '起步价下调 AED 10,000。', source: 'GWM UAE' },
  { id: 'tank-500-price-down', date: '2026-05-26', brand: 'GWM / TANK', model: 'TANK 500', changeType: 'PRICE_DOWN', previousValue: 'AED 159,900 + VAT', currentValue: 'AED 149,900 + VAT', impact: '起步价下调 AED 10,000。', source: 'GWM UAE' },
  { id: 'byd-seal-7-emi-up', date: '2026-05-26', brand: 'BYD', model: 'SEAL 7', changeType: 'EMI_UP', previousValue: 'AED 1,499/mo', currentValue: 'AED 1,599/mo', impact: '月供上调 AED 100；服务期限更清晰。', source: 'BYD UAE Offers' },
  { id: 'byd-seal-6-emi-up', date: '2026-05-26', brand: 'BYD', model: 'SEAL 6', changeType: 'EMI_UP', previousValue: 'AED 1,299/mo', currentValue: 'AED 1,399/mo', impact: '官网当前月供显示 AED 1,399/月。', source: 'BYD UAE Offers' },
  { id: 'byd-shark-6-benefit', date: '2026-05-26', brand: 'BYD', model: 'SHARK 6', changeType: 'BENEFIT_ADDED', previousValue: '免费注册 + service', currentValue: '0% finance + free tint + 2 years / 45,000 km service', impact: '优惠包更激进。', source: 'BYD UAE Offers' },
  { id: 'byd-sealion-5-benefit', date: '2026-05-26', brand: 'BYD', model: 'SEALION 5', changeType: 'BENEFIT_ADDED', previousValue: '免费注册 + service', currentValue: '0% finance + free insurance + 2 years / 45,000 km service', impact: '新增金融和保险权益。', source: 'BYD UAE Offers' },
  { id: 'nissan-altima-fuel', date: '2026-05-26', brand: 'Nissan', model: 'Altima', changeType: 'BENEFIT_ADDED', previousValue: '5年服务 / 保修 / 道路救援', currentValue: '新增3年免费燃油', impact: '降低客户感知用车成本。', source: 'Nissan Abu Dhabi' },
  { id: 'nissan-xtrail-fuel', date: '2026-05-26', brand: 'Nissan', model: 'X-Trail', changeType: 'BENEFIT_ADDED', previousValue: '5年服务 / 保修 / 道路救援', currentValue: '新增最高3年免费燃油', impact: '燃油活动增强SUV优惠吸引力。', source: 'Nissan Abu Dhabi' },
  { id: 'mitsubishi-destinator-new', date: '2026-05-26', brand: 'Mitsubishi', model: 'Destinator', changeType: 'NEW_MODEL', previousValue: '-', currentValue: 'AED 69,900', impact: '追踪池新增SUV价格点。', source: 'Mitsubishi UAE Offers' },
];
