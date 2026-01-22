export enum NewsType {
  LAUNCH_PHYSICAL = "Launch (Physical)",
  TECH_OTA = "Tech & OTA",
  MARKET_SALES = "Market & Sales",
  POLICY = "Policy & Regulation",
  NETWORK_SERVICE = "Network & Service",
  COMPETITOR_TACTICS = "Competitor Tactics",
  CORP_STRATEGY = "Corp & Strategy",
  OTHER = "Other"
}

export const NEWS_IMPORTANCE: Record<NewsType, number> = {
  [NewsType.LAUNCH_PHYSICAL]: 3, // High (Critical Event)
  [NewsType.POLICY]: 3,         // High (Market Rule Change)
  [NewsType.CORP_STRATEGY]: 2,  // Medium (Strategic Move)
  [NewsType.MARKET_SALES]: 2,   // Medium (Performance)
  [NewsType.TECH_OTA]: 1,       // Low
  [NewsType.NETWORK_SERVICE]: 1,// Low
  [NewsType.COMPETITOR_TACTICS]: 2, // Medium
  [NewsType.OTHER]: 0
};

export const getNewsImportance = (type: NewsType): number => NEWS_IMPORTANCE[type] || 0;
export const isKeyNews = (type: NewsType): boolean => getNewsImportance(type) >= 2;

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface NewsItem {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  title: string;
  summary: string;
  type: NewsType;
  brand: string;
  source: string;
  image?: string;
  url: string;
  original_text?: string;
  sentiment?: SentimentType; // 新增：情感分析
  tags?: string[]; // 新增：标签系统
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBrands: string[];
  selectedTypes: NewsType[];
  searchQuery: string;
}
