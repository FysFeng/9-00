import { NewsItem, NewsType } from '../types';

export interface HeatmapDataPoint {
    date: string;       // YYYY-MM-DD
    brand: string;
    count: number;
    intensity: number;  // 0-4 scale for coloring
}

export interface BrandStrategyProfile {
    brand: string;
    status: 'Aggressive' | 'Defensive' | 'Balanced';
    statusLabel: string;
    statusColor: string;
    topKeywords: string[];
    totalNews: number;
    launchRatio: number; // For detailed checking
}

// --- 1. Heatmap Logic ---
export const generateHeatmapData = (news: NewsItem[], brands: string[], days: number = 14): HeatmapDataPoint[] => {
    const data: HeatmapDataPoint[] = [];
    const today = new Date();

    // Generate last N days strings
    const dateRange = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (days - 1 - i));
        return d.toISOString().split('T')[0];
    });

    brands.forEach(brand => {
        dateRange.forEach(date => {
            const count = news.filter(n => n.brand === brand && n.date === date).length;
            // Simple linear intensity mapping: 0=0, 1=1, 2=2, 3+=3
            const intensity = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;

            data.push({
                date,
                brand,
                count,
                intensity
            });
        });
    });

    return data;
};

// --- 2. Battle Card Logic (Hard Rules) ---
export const getBrandProfile = (brand: string, news: NewsItem[]): BrandStrategyProfile => {
    const brandNews = news.filter(n => n.brand === brand);
    const total = brandNews.length;

    if (total === 0) {
        return {
            brand,
            status: 'Balanced',
            statusLabel: '暂无数据',
            statusColor: 'bg-slate-100 text-slate-400',
            topKeywords: [],
            totalNews: 0,
            launchRatio: 0
        };
    }

    // Counts
    const launches = brandNews.filter(n => n.type === NewsType.LAUNCH_PHYSICAL).length;
    const tactics = brandNews.filter(n => n.type === NewsType.COMPETITOR_TACTICS).length;
    const service = brandNews.filter(n => n.type === NewsType.NETWORK_SERVICE).length;
    const strategy = brandNews.filter(n => n.type === NewsType.CORP_STRATEGY).length;

    // Ratios
    const activeScore = (launches + tactics) / total;
    const brandScore = (service + strategy) / total;

    let status: BrandStrategyProfile['status'] = 'Balanced';
    let statusLabel = '稳健运营 (Balanced)';
    let statusColor = 'bg-blue-50 text-blue-600 border-blue-200';

    if (activeScore >= 0.4) {
        status = 'Aggressive'; // Keeping key internal for now or change if type allows, simpler to change label
        statusLabel = '高活跃 (High Activity)';
        statusColor = 'bg-red-50 text-red-600 border-red-200';
    } else if (brandScore >= 0.4) {
        status = 'Defensive';
        statusLabel = '品牌聚焦 (Brand Focus)';
        statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }

    // Extract Top 3 Keywords
    const allTags = brandNews.flatMap(n => n.tags || []);
    const tagCounts: Record<string, number> = {};
    allTags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
    const topKeywords = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t]) => t);

    return {
        brand,
        status,
        statusLabel,
        statusColor,
        topKeywords,
        totalNews: total,
        launchRatio: activeScore
    };
};

// --- 3. Radar Data Helper ---
export const getRadarData = (brandA: string, brandB: string, news: NewsItem[]) => {
    const categories = [
        { key: NewsType.LAUNCH_PHYSICAL, label: '新车发布' },
        { key: NewsType.MARKET_SALES, label: '市场销量' },
        { key: NewsType.POLICY, label: '政策法规' },
        { key: NewsType.COMPETITOR_TACTICS, label: '价格战术' },
        { key: NewsType.NETWORK_SERVICE, label: '渠道服务' }, // Typo handling if needed, usually NETWORK_SERVICE
        { key: NewsType.CORP_STRATEGY, label: '企业战略' },
        // Tech can be merged or added based on space
        { key: NewsType.TECH_OTA, label: '技术研发' }
    ];

    return categories.map(cat => {
        const newsA = news.filter(n => n.brand === brandA);
        const newsB = news.filter(n => n.brand === brandB); // Fixed bug: was brandA

        const countA = newsA.filter(n => n.type === cat.key).length;
        const countB = newsB.filter(n => n.type === cat.key).length;

        // Normalize to Percentage to allow fair comparison between big and small brands
        // Or specific Max Value. 
        // Using raw count capped at 10 for visual clarity, or simple ratio.
        // Let's use Raw Count for now to show "Volume Difference" too.

        return {
            subject: cat.label,
            A: countA,
            B: countB,
            fullMark: Math.max(countA, countB, 4) // Dynamic Axis
        };
    });
};
