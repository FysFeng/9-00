export enum NewsType {
  LAUNCH_PHYSICAL = 'Launch (Physical)',
  TECH_OTA = 'Tech & OTA',
  MARKET_SALES = 'Market & Sales',
  POLICY = 'Policy & Regulation',
  NETWORK_SERVICE = 'Network & Service',
  COMPETITOR_TACTICS = 'Competitor Tactics',
  CORP_STRATEGY = 'Corp & Strategy',
  OTHER = 'Other',
}

export const NEWS_IMPORTANCE: Record<NewsType, number> = {
  [NewsType.LAUNCH_PHYSICAL]: 3,
  [NewsType.POLICY]: 3,
  [NewsType.CORP_STRATEGY]: 2,
  [NewsType.MARKET_SALES]: 2,
  [NewsType.TECH_OTA]: 1,
  [NewsType.NETWORK_SERVICE]: 1,
  [NewsType.COMPETITOR_TACTICS]: 2,
  [NewsType.OTHER]: 0,
};

export const getNewsImportance = (type: NewsType): number => NEWS_IMPORTANCE[type] || 0;
export const isKeyNews = (type: NewsType): boolean => getNewsImportance(type) >= 2;

export type SentimentType = 'positive' | 'neutral' | 'negative';

export type StrategySignalCategory =
  | 'price'
  | 'finance'
  | 'insurance'
  | 'trade_in'
  | 'service'
  | 'campaign'
  | 'distribution'
  | 'inventory'
  | 'charging'
  | 'delivery'
  | 'buyback'
  | 'fleet'
  | 'bundle'
  | 'other';

export interface StrategySignal {
  category: StrategySignalCategory;
  action: string;
  model?: string;
  msrp?: string;
  currency?: string;
  current_value?: string;
  previous_value?: string;
  note?: string;
  raw_excerpt?: string;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  type: NewsType;
  brand: string;
  source: string;
  image?: string;
  url: string;
  original_text?: string;
  sentiment?: SentimentType;
  tags?: string[];
  model?: string;
  msrp?: string;
  currency?: string;
  strategySignals?: StrategySignal[];
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBrands: string[];
  selectedTypes: NewsType[];
  searchQuery: string;
}
