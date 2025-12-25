import { NewsType, NewsItem } from './types';

export const DEFAULT_BRANDS = [
  "Toyota 丰田",
  "Hyundai 现代",
  "Kia 起亚",
  "Nissan 日产",
  "Lexus 雷克萨斯",
  "Ford 福特",
  "Jetour 捷途",
  "MG 名爵",
  "Geely 吉利",
  "GWM 长城",
  "BYD 比亚迪",
  "ICAUR 奇瑞",
  "GAC 广汽",
  "政策相关",
  "Other 其他品牌",
];

export const NEWS_TYPES_LIST = [
  NewsType.LAUNCH,
  NewsType.POLICY,
  NewsType.SALES,
  NewsType.PERSONNEL,
  NewsType.COMPETITOR,
  NewsType.OTHER
];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  [NewsType.LAUNCH]: "新车上市",
  [NewsType.POLICY]: "政策法规",
  [NewsType.SALES]: "市场销量",
  [NewsType.PERSONNEL]: "人事变动",
  [NewsType.COMPETITOR]: "竞品动态",
  [NewsType.OTHER]: "其他"
};

// Helper to generate a random ID
const uuid = () => Math.random().toString(36).substring(2, 15);

// Initial Demo Data
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getAIImage = (prompt: string) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;

// 把原来的假数据全删掉，只留一个空数组
export const INITIAL_NEWS: NewsItem[] = [];
