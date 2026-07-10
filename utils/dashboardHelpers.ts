import { NewsItem, NewsType } from '../types';

export interface HeatmapDataPoint {
    date: string;
    brand: string;
    count: number;
    intensity: number;
}

export interface BrandStrategyProfile {
    brand: string;
    status: 'Aggressive' | 'Defensive' | 'Balanced';
    statusLabel: string;
    statusColor: string;
    topKeywords: string[];
    totalNews: number;
    launchRatio: number;
}

export const generateHeatmapData = (news: NewsItem[], brands: string[], days: number = 14): HeatmapDataPoint[] => {
    const data: HeatmapDataPoint[] = [];
    const sortedDates = news
        .map((item) => item.date)
        .filter(Boolean)
        .sort();
    const anchorDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : new Date().toISOString().split('T')[0];
    const anchor = new Date(`${anchorDate}T00:00:00`);

    const dateRange = Array.from({ length: days }, (_, index) => {
        const date = new Date(anchor);
        date.setDate(anchor.getDate() - (days - 1 - index));
        return date.toISOString().split('T')[0];
    });

    brands.forEach((brand) => {
        dateRange.forEach((date) => {
            const count = news.filter((item) => item.brand === brand && item.date === date).length;
            const intensity = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
            data.push({ date, brand, count, intensity });
        });
    });

    return data;
};

export const getBrandProfile = (brand: string, news: NewsItem[]): BrandStrategyProfile => {
    const brandNews = news.filter((item) => item.brand === brand);
    const total = brandNews.length;

    if (total === 0) {
        return {
            brand,
            status: 'Balanced',
            statusLabel: '暂无数据',
            statusColor: 'bg-slate-100 text-slate-400 border-slate-200',
            topKeywords: [],
            totalNews: 0,
            launchRatio: 0,
        };
    }

    const launches = brandNews.filter((item) => item.type === NewsType.LAUNCH_PHYSICAL).length;
    const tactics = brandNews.filter((item) => item.type === NewsType.COMPETITOR_TACTICS).length;
    const service = brandNews.filter((item) => item.type === NewsType.NETWORK_SERVICE).length;
    const strategy = brandNews.filter((item) => item.type === NewsType.CORP_STRATEGY).length;

    const activeScore = (launches + tactics) / total;
    const brandScore = (service + strategy) / total;

    let status: BrandStrategyProfile['status'] = 'Balanced';
    let statusLabel = '稳健运营 (Balanced)';
    let statusColor = 'bg-blue-50 text-blue-600 border-blue-200';

    if (activeScore >= 0.4) {
        status = 'Aggressive';
        statusLabel = '高活跃 (High Activity)';
        statusColor = 'bg-red-50 text-red-600 border-red-200';
    } else if (brandScore >= 0.4) {
        status = 'Defensive';
        statusLabel = '品牌聚焦 (Brand Focus)';
        statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }

    const tagCounts: Record<string, number> = {};
    brandNews.flatMap((item) => item.tags || []).forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topKeywords = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);

    return {
        brand,
        status,
        statusLabel,
        statusColor,
        topKeywords,
        totalNews: total,
        launchRatio: activeScore,
    };
};

export const getRadarData = (brandA: string, brandB: string, news: NewsItem[]) => {
    const categories = [
        { key: NewsType.LAUNCH_PHYSICAL, label: '新车发布' },
        { key: NewsType.MARKET_SALES, label: '销量数据' },
        { key: NewsType.COMPETITOR_TACTICS, label: '价格/促销' },
        { key: NewsType.NETWORK_SERVICE, label: '售后/渠道' },
        { key: NewsType.CORP_STRATEGY, label: '企业动态' },
    ];

    return categories.map((category) => {
        const newsA = news.filter((item) => item.brand === brandA);
        const newsB = news.filter((item) => item.brand === brandB);
        const countA = newsA.filter((item) => item.type === category.key).length;
        const countB = newsB.filter((item) => item.type === category.key).length;

        return {
            subject: category.label,
            A: countA,
            B: countB,
            fullMark: Math.max(countA, countB, 4),
        };
    });
};
