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

// [Feature A] 新增：待处理情报结构
export interface PendingItem {
  id: string;        // 通常是 URL 的 Hash 或随机 ID
  title: string;
  link: string;
  pubDate: string;   // 原始发布时间
  sourceName: string; // 如 "Gulf News"
  snippet: string;   // 原始内容摘要（未清洗）
  status: 'pending' | 'analyzed' | 'dismissed'; // 状态管理
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBrands: string[];
  selectedTypes: NewsType[];
  searchQuery: string;
}
}
