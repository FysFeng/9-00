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
    mainOffer: 'Free registration + free insurance; register interest',
    sourceStatus: 'User input',
    updatedAt: '2026-05-26',
    details: { insurance: 'Free insurance', registration: 'Free registration', note: 'Launch interest registration campaign.' },
  },
  {
    id: 'byd-seal-7',
    brand: 'BYD',
    model: 'SEAL 7',
    startingEmi: 'AED 1,599/mo',
    startingPrice: 'AED 109,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + 4 years / 90,000 km service',
    sourceStatus: 'Official checked',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: '4 years / 90,000 km', note: 'EMI increased from AED 1,499/mo.' },
  },
  {
    id: 'byd-song-plus',
    brand: 'BYD',
    model: 'SONG PLUS',
    startingEmi: 'AED 1,699/mo',
    startingPrice: 'AED 119,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + free service',
    sourceStatus: 'User price + official offer',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: 'Free service' },
  },
  {
    id: 'byd-shark-6',
    brand: 'BYD',
    model: 'SHARK 6',
    startingEmi: 'AED 2,399/mo',
    startingPrice: 'AED 158,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + free registration + 2 years / 45,000 km service + free tint',
    sourceStatus: 'Official checked + user price',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', registration: 'Free registration', service: '2 years / 45,000 km', tinting: 'Free tint' },
  },
  {
    id: 'byd-sealion-7',
    brand: 'BYD',
    model: 'SEALION 7',
    startingEmi: 'AED 2,199/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + free service + 1-year ADNOC charging',
    sourceStatus: 'User input',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: 'Free service', charging: '1-year ADNOC charging' },
  },
  {
    id: 'byd-sealion-5',
    brand: 'BYD',
    model: 'SEALION 5',
    startingEmi: 'AED 1,399/mo',
    startingPrice: 'AED 89,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + 2 years / 45,000 km service',
    sourceStatus: 'Official checked + user price',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: '2 years / 45,000 km' },
  },
  {
    id: 'byd-seal',
    brand: 'BYD',
    model: 'SEAL',
    startingEmi: 'AED 1,999/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + free service + 1-year ADNOC charging',
    sourceStatus: 'User input',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: 'Free service', charging: '1-year ADNOC charging' },
  },
  {
    id: 'byd-qin-plus',
    brand: 'BYD',
    model: 'QIN PLUS',
    startingEmi: 'AED 1,099/mo',
    startingPrice: 'AED 74,900',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + free service',
    sourceStatus: 'User price + official offer',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: 'Free service' },
  },
  {
    id: 'byd-atto-8',
    brand: 'BYD',
    model: 'ATTO 8',
    startingEmi: 'AED 2,399/mo',
    startingPrice: 'AED 159,900',
    offerLogic: 'AND',
    mainOffer: 'Free registration + 3 years / 65,000 km service',
    sourceStatus: 'Official checked + user price',
    updatedAt: '2026-05-26',
    details: { registration: 'Free registration', service: '3 years / 65,000 km' },
  },
  {
    id: 'byd-han',
    brand: 'BYD',
    model: 'HAN',
    startingEmi: 'AED 2,699/mo',
    startingPrice: '-',
    offerLogic: 'AND',
    mainOffer: '0% finance + free insurance + free registration + free service + free home charger',
    sourceStatus: 'User input',
    updatedAt: '2026-05-26',
    details: { finance: '0% finance', insurance: 'Free insurance', registration: 'Free registration', service: 'Free service', charging: 'Free home charger' },
  },
  {
    id: 'byd-seal-6',
    brand: 'BYD',
    model: 'SEAL 6',
    startingEmi: 'AED 1,399/mo',
    startingPrice: 'AED 87,900',
    offerLogic: 'AND',
    mainOffer: 'Free registration + 2 years / 45,000 km service',
    sourceStatus: 'Official checked + user price',
    updatedAt: '2026-05-26',
    details: { registration: 'Free registration', service: '2 years / 45,000 km', note: 'Official EMI now shows AED 1,399/mo.' },
  },
  {
    id: 'jetour-t1',
    brand: 'Jetour',
    model: 'T1',
    startingEmi: 'AED 1,349/mo',
    startingPrice: '-',
    offerLogic: 'OR',
    mainOffer: '0 VAT OR 0% interest for 3 years; pay after 6 months',
    sourceStatus: 'Official checked',
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
    mainOffer: '0 VAT OR 0% interest for 3 years; pay after 6 months',
    sourceStatus: 'User price + official EMI',
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
    mainOffer: '0 VAT OR 0% interest for 3 years; pay after 6 months',
    sourceStatus: 'Official checked',
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
    mainOffer: 'All-inclusive package OR 0% finance up to 5 years OR lease option',
    sourceStatus: 'Official checked',
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
    mainOffer: 'Monthly payment offer; extra benefits not publicly listed',
    sourceStatus: 'Official checked',
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
    mainOffer: 'Insurance + servicing + extended warranty + tinting + registration',
    sourceStatus: 'Official checked',
    updatedAt: '2026-05-26',
    details: { insurance: 'Included', registration: 'Included', service: 'Included servicing', warranty: 'Extended warranty', tinting: 'Included' },
  },
  {
    id: 'tank-300',
    brand: 'GWM / TANK',
    model: 'TANK 300',
    startingEmi: 'AED 1,899/mo',
    startingPrice: 'AED 109,900 + VAT',
    offerLogic: 'AND',
    mainOffer: 'Payment protection + free insurance + registration + 5-year service + roadside + 3M tinting',
    sourceStatus: 'Official price + user offer',
    updatedAt: '2026-05-26',
    details: { insurance: 'Free insurance', registration: 'Free registration', service: '5-year premium service plan', roadside: '5 years', tinting: '3M tinting', note: 'Starting price decreased by AED 10,000.' },
  },
  {
    id: 'tank-500',
    brand: 'GWM / TANK',
    model: 'TANK 500',
    startingEmi: 'AED 2,499/mo',
    startingPrice: 'AED 149,900 + VAT',
    offerLogic: 'AND',
    mainOffer: 'Payment protection + free insurance + registration + 5-year service + roadside + 3M tinting',
    sourceStatus: 'Official price + user offer',
    updatedAt: '2026-05-26',
    details: { insurance: 'Free insurance', registration: 'Free registration', service: '5-year premium service plan', roadside: '5 years', tinting: '3M tinting', note: 'Starting price decreased by AED 10,000.' },
  },
  {
    id: 'haval-h7',
    brand: 'Haval',
    model: 'H7',
    startingEmi: 'AED 1,499/mo',
    startingPrice: 'AED 99,900 + VAT',
    offerLogic: 'AND + OR',
    mainOffer: 'Payment protection + 0% profit for 3 years OR free 3-year service contract',
    sourceStatus: 'User offer + official price',
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
    mainOffer: 'Payment protection + 0% profit OR service package with registration and support benefits',
    sourceStatus: 'User offer + official price',
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
    mainOffer: 'Payment protection + free 3-year service and registration OR AED 10,000 cash discount',
    sourceStatus: 'User offer + official price',
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
    mainOffer: '5-year warranty + roadside + 5 years / 100,000 km service + 3 years free fuel',
    sourceStatus: 'Official checked + user EMI',
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
    mainOffer: '5-year warranty + roadside + 5 years / 100,000 km service + up to 3 years free fuel',
    sourceStatus: 'Official checked',
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
    mainOffer: '5-year warranty + roadside + 3 years / 60,000 km service',
    sourceStatus: 'User input',
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
    mainOffer: 'Free 5-year service + 5-year warranty + 5-year roadside assistance',
    sourceStatus: 'User input',
    updatedAt: '2026-05-26',
    details: { service: 'Free 5-year service', warranty: '5 years', roadside: '5 years' },
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
    mainOffer: 'SUV lineup starting price',
    sourceStatus: 'Official checked',
    updatedAt: '2026-05-26',
    details: { note: 'Price-only offer; no clear finance/service bundle found.' },
  })),
];

export const offerChanges: OfferChange[] = [
  { id: 'tank-300-price-down', date: '2026-05-26', brand: 'GWM / TANK', model: 'TANK 300', changeType: 'PRICE_DOWN', previousValue: 'AED 119,900 + VAT', currentValue: 'AED 109,900 + VAT', impact: 'Starting price decreased by AED 10,000.', source: 'GWM UAE' },
  { id: 'tank-500-price-down', date: '2026-05-26', brand: 'GWM / TANK', model: 'TANK 500', changeType: 'PRICE_DOWN', previousValue: 'AED 159,900 + VAT', currentValue: 'AED 149,900 + VAT', impact: 'Starting price decreased by AED 10,000.', source: 'GWM UAE' },
  { id: 'byd-seal-7-emi-up', date: '2026-05-26', brand: 'BYD', model: 'SEAL 7', changeType: 'EMI_UP', previousValue: 'AED 1,499/mo', currentValue: 'AED 1,599/mo', impact: 'Monthly payment increased by AED 100; service term is clearer.', source: 'BYD UAE Offers' },
  { id: 'byd-seal-6-emi-up', date: '2026-05-26', brand: 'BYD', model: 'SEAL 6', changeType: 'EMI_UP', previousValue: 'AED 1,299/mo', currentValue: 'AED 1,399/mo', impact: 'Official EMI now shows AED 1,399/mo.', source: 'BYD UAE Offers' },
  { id: 'byd-shark-6-benefit', date: '2026-05-26', brand: 'BYD', model: 'SHARK 6', changeType: 'BENEFIT_ADDED', previousValue: 'Free registration + service', currentValue: '0% finance + free tint + 2 years / 45,000 km service', impact: 'Offer package became more aggressive.', source: 'BYD UAE Offers' },
  { id: 'byd-sealion-5-benefit', date: '2026-05-26', brand: 'BYD', model: 'SEALION 5', changeType: 'BENEFIT_ADDED', previousValue: 'Free registration + service', currentValue: '0% finance + free insurance + 2 years / 45,000 km service', impact: 'Finance and insurance benefits were added.', source: 'BYD UAE Offers' },
  { id: 'nissan-altima-fuel', date: '2026-05-26', brand: 'Nissan', model: 'Altima', changeType: 'BENEFIT_ADDED', previousValue: '5-year service / warranty / roadside', currentValue: 'Added 3 years free fuel', impact: 'Lower perceived running cost for customers.', source: 'Nissan Abu Dhabi' },
  { id: 'nissan-xtrail-fuel', date: '2026-05-26', brand: 'Nissan', model: 'X-Trail', changeType: 'BENEFIT_ADDED', previousValue: '5-year service / warranty / roadside', currentValue: 'Added up to 3 years free fuel', impact: 'Fuel campaign increases SUV offer appeal.', source: 'Nissan Abu Dhabi' },
  { id: 'mitsubishi-destinator-new', date: '2026-05-26', brand: 'Mitsubishi', model: 'Destinator', changeType: 'NEW_MODEL', previousValue: '-', currentValue: 'AED 69,900', impact: 'New SUV price point added to the tracked set.', source: 'Mitsubishi UAE Offers' },
];
