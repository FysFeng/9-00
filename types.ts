{
type: uploaded file
fileName: types.ts
fullContent:
export enum NewsType {
  LAUNCH = "New Car Launch",
  POLICY = "Policy & Regulation",
  SALES = "Market Sales",
  PERSONNEL = "Personnel Changes",
  COMPETITOR = "Competitor Dynamics",
  OTHER = "Other"
}

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface NewsItem {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  title: string;
  summary: string;
  type: NewsType;
  brand: string;
  source: string;
  image: string;
  url: string;
  sentiment?: SentimentType;
  tags?: string[];
}

// [Feature A Updated] 增加 imageUrl 字段
export interface PendingItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  sourceName: string;
  snippet: string;
  imageUrl?: string; // 提取到的封面图链接
  status: 'pending' | 'analyzed' | 'dismissed';
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBrands: string[];
  selectedTypes: NewsType[];
  searchQuery: string;
}
}
