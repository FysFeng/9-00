import React, { useMemo } from 'react';
import { useIntelligenceStore, SalesViewMode } from '../src/store/useIntelligenceStore';
import { generateHeatmapData, getBrandProfile } from '../utils/dashboardHelpers';
import { NewsItem, NewsType, StrategySignalCategory } from '../types';

type SignalPreview = {
    id: string;
    brand: string;
    model: string;
    date: string;
    source: string;
    category: StrategySignalCategory;
    previousValue: string;
    currentValue: string;
    action: string;
    note: string;
};

const CATEGORY_LABELS: Record<StrategySignalCategory, string> = {
    price: '价格下降',
    finance: '金融变化',
    insurance: '权益新增',
    trade_in: '置换补贴',
    service: '服务变化',
    campaign: '活动变化',
    distribution: '渠道变化',
    inventory: '库存变化',
    charging: '补能变化',
    delivery: '交付变化',
    buyback: '回购变化',
    fleet: '大客户变化',
    bundle: '礼包变化',
    other: '策略变化',
};

const getBrandShortName = (brand: string) => brand.split(' ')[0] || brand;

const HEATMAP_PRIORITY_BRANDS = [
    'Changan 长安',
    'BYD 比亚迪',
    'Geely 吉利',
    'Chery iCAUR',
    'Omoda & Jaecoo',
    'GWM 长城',
    'Jetour 捷途',
];

const BRAND_NORMALIZATION_RULES: Array<{ label: string; patterns: RegExp[] }> = [
    { label: 'BYD 比亚迪', patterns: [/\bbyd\b/i, /比亚迪/] },
    { label: 'Geely Zeekr 极氪', patterns: [/\bzeekr\b/i, /极氪/] },
    { label: 'Geely 吉利', patterns: [/\bgeely\b/i, /吉利/] },
    { label: 'Chery iCAUR', patterns: [/\bicaur\b/i, /\bicaur\b/i] },
    { label: 'Omoda & Jaecoo', patterns: [/\bomoda\b/i, /\bjaecoo\b/i] },
    { label: 'GWM 长城', patterns: [/\bgwm\b/i, /\bhaval\b/i, /\btank\b/i, /长城/] },
    { label: 'Jetour 捷途', patterns: [/\bjetour\b/i, /捷途/] },
    { label: 'MG 名爵', patterns: [/\bmg\b/i, /名爵/] },
    { label: 'Kia 起亚', patterns: [/\bkia\b/i, /起亚/] },
    { label: 'Toyota 丰田', patterns: [/\btoyota\b/i, /丰田/] },
    { label: 'Ford 福特', patterns: [/\bford\b/i, /福特/] },
    { label: 'Tesla 特斯拉', patterns: [/\btesla\b/i, /特斯拉/] },
    { label: 'Nissan 日产', patterns: [/\bnissan\b/i, /日产/] },
    { label: 'BMW 宝马', patterns: [/\bbmw\b/i, /宝马/] },
    { label: 'Lexus 雷克萨斯', patterns: [/\blexus\b/i, /雷克萨斯/] },
    { label: 'Li Auto 理想', patterns: [/\bli auto\b/i, /理想/] },
];

const getHeatmapBrandName = (brand: string = '') => {
    const trimmed = brand.trim();
    if (!trimmed) return '';

    const lower = trimmed.toLowerCase();
    if (
        lower === 'other'
        || lower.startsWith('other ')
        || lower.includes('policy')
        || lower.includes('rta')
        || trimmed.includes('政策')
        || trimmed.includes('鏀跨瓥')
    ) {
        return '';
    }

    const matchedRule = BRAND_NORMALIZATION_RULES.find((rule) =>
        rule.patterns.some((pattern) => pattern.test(trimmed)),
    );
    return matchedRule?.label || trimmed;
};

const heatmapBrandMatcher = (itemBrand: string, targetBrand: string) => getHeatmapBrandName(itemBrand) === targetBrand;

function SectionHeader({ title, subtitle, accent }: { title: string; subtitle?: string; accent?: string }) {
    return (
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <div className={`w-1 h-5 ${accent || 'bg-gradient-to-b from-blue-500 to-indigo-600'} rounded-full`} />
                {title}
            </h3>
            {subtitle && (
                <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-md border border-slate-200">
                    {subtitle}
                </span>
            )}
        </div>
    );
}

function PolicyMonitor({ allNews }: { allNews: NewsItem[] }) {
    const policyNews = useMemo(() => {
        return allNews
            .filter((item) => item.type === NewsType.POLICY || item.brand.includes('政策'))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 4);
    }, [allNews]);

    const getSourceBadge = (source: string = '') => {
        const lower = source.toLowerCase();
        if (lower.includes('rta')) return { label: 'RTA', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        if (lower.includes('dewa')) return { label: 'DEWA', color: 'bg-green-100 text-green-700 border-green-200' };
        if (lower.includes('wam')) return { label: 'WAM', color: 'bg-slate-100 text-slate-700 border-slate-200' };
        if (lower.includes('moei')) return { label: 'MOEI', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { label: source || '官方', color: 'bg-red-50 text-red-700 border-red-200' };
    };

    return (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 lg:p-8 h-full overflow-hidden">
            <SectionHeader
                title="UAE 政策动态监控"
                subtitle="RTA / DEWA / WAM / MOEI"
                accent="bg-gradient-to-b from-red-500 to-rose-600"
            />

            {policyNews.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-slate-300 text-sm font-medium">暂无政策类资讯</p>
                    <p className="text-slate-300 text-xs mt-1">采集或录入政策新闻后会显示在这里</p>
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto pr-1 max-h-[430px] custom-scrollbar">
                    {policyNews.map((item) => {
                        const badge = getSourceBadge(item.source);
                        return (
                            <div key={item.id} className="flex gap-3 rounded-xl group">
                                <div className="shrink-0 mt-1 text-lg">🏛️</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.summary}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PriceChangePreview({ items }: { items: NewsItem[] }) {
    const previews = useMemo<SignalPreview[]>(() => {
        const toPreview = (item: NewsItem, signalIndex = 0): SignalPreview | null => {
            const signals = item.strategySignals || [];
            const priceSignal = signals.find((signal) => signal.category === 'price');
            const supportSignals = signals.filter((signal) => signal.category !== 'price');
            const primarySignal = priceSignal || signals[signalIndex];
            if (!primarySignal) return null;

            const supportText = supportSignals
                .slice(0, 3)
                .map((signal) => signal.current_value || signal.note || signal.action)
                .filter(Boolean)
                .join('；');

            return {
                id: `${item.id}-preview`,
                brand: item.brand,
                model: primarySignal.model || item.model || getBrandShortName(item.brand),
                date: item.date,
                source: item.source,
                category: primarySignal.category,
                previousValue: primarySignal.previous_value || '',
                currentValue: primarySignal.current_value || primarySignal.msrp || item.msrp || supportText || '',
                action: item.source === 'offer info.xlsx'
                    ? `${item.model || primarySignal.model} 当前 offer 更新`
                    : primarySignal.action,
                note: supportText || primarySignal.note || primarySignal.raw_excerpt || '',
            };
        };

        const offerItems = items.filter((item) => item.source === 'offer info.xlsx' && item.strategySignals?.length);
        if (offerItems.length > 0) {
            const groupedByBrand = new Map<string, SignalPreview[]>();
            offerItems.forEach((item) => {
                const preview = toPreview(item);
                if (!preview) return;
                const brand = getBrandShortName(preview.brand);
                groupedByBrand.set(brand, [...(groupedByBrand.get(brand) || []), preview]);
            });

            const brandOrder = ['BYD', 'GWM', 'Jetour', 'Toyota', 'Nissan', 'Mitsubishi'];
            const featured = brandOrder
                .map((brand) => groupedByBrand.get(brand)?.find((item) => item.currentValue) || groupedByBrand.get(brand)?.[0])
                .filter(Boolean) as SignalPreview[];
            const featuredIds = new Set(featured.map((item) => item.id));
            const rest = offerItems
                .map((item) => toPreview(item))
                .filter((item): item is SignalPreview => Boolean(item) && !featuredIds.has(item.id));

            return [...featured, ...rest].slice(0, 5);
        }

        return items
            .flatMap((item) =>
                (item.strategySignals || []).map((signal, index) => ({
                    id: `${item.id}-${index}`,
                    brand: item.brand,
                    model: signal.model || item.model || getBrandShortName(item.brand),
                    date: item.date,
                    source: item.source,
                    category: signal.category,
                    previousValue: signal.previous_value || '',
                    currentValue: signal.current_value || signal.msrp || item.msrp || signal.note || '',
                    action: signal.action,
                    note: signal.note || signal.raw_excerpt || '',
                })),
            )
            .filter((item) => item.model && (item.previousValue || item.currentValue || item.action))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);
    }, [items]);

    return (
        <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 h-full">
            <SectionHeader title="价格变化示例" subtitle="offer info.xlsx 摘要" accent="bg-gradient-to-b from-emerald-500 to-teal-600" />
            {previews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-400">暂无结构化优惠变化</p>
                    <p className="text-xs text-slate-400 mt-1">采集并由 AI 提取价格、金融、保险等信号后会显示在这里</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1 custom-scrollbar">
                    {previews.map((item) => {
                        const hasValueChange = Boolean(item.previousValue || item.currentValue);
                        return (
                            <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-base font-black text-slate-900 truncate">
                                            {getBrandShortName(item.brand)} / {item.model}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 truncate">{item.source || '未标注来源'} · {item.date}</div>
                                    </div>
                                    <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${
                                        item.category === 'price'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {CATEGORY_LABELS[item.category]}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-700 leading-relaxed">{item.action}</p>
                                {hasValueChange && (
                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-500 truncate max-w-[180px]">{item.previousValue || '此前未标注'}</span>
                                        <span className="text-slate-300">→</span>
                                        <span className="rounded-md bg-emerald-50 px-2 py-1 font-bold text-emerald-700 truncate max-w-[200px]">{item.currentValue || '当前未标注'}</span>
                                    </div>
                                )}
                                {item.note && <p className="text-xs text-slate-400 mt-2 line-clamp-1">{item.note}</p>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const Dashboard: React.FC = () => {
    const { rawIntelligence, filters, customBrands, salesViewMode } = useIntelligenceStore();

    const visibleBrands = useMemo(() => {
        const sourceBrands = filters.selectedBrands.length > 0
            ? filters.selectedBrands
            : rawIntelligence.map((item) => item.brand);
        const normalizedBrands = sourceBrands
            .map(getHeatmapBrandName)
            .filter(Boolean);

        return Array.from(new Set(normalizedBrands.length > 0 ? normalizedBrands : customBrands));
    }, [filters.selectedBrands, customBrands, rawIntelligence]);

    const filteredGlobalNews = useMemo(() => {
        const selectedBrands = new Set(filters.selectedBrands.map(getHeatmapBrandName).filter(Boolean));
        return rawIntelligence.filter((item) => {
            const startMatch = !filters.startDate || item.date >= filters.startDate;
            const endMatch = !filters.endDate || item.date <= filters.endDate;
            const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
            const brandName = getHeatmapBrandName(item.brand);
            const brandMatch = selectedBrands.size === 0 || selectedBrands.has(brandName);
            return startMatch && endMatch && typeMatch && brandMatch;
        });
    }, [rawIntelligence, filters.startDate, filters.endDate, filters.selectedTypes, filters.selectedBrands]);

    const topBrands = useMemo(() => {
        const priorityRank = new Map(HEATMAP_PRIORITY_BRANDS.map((brand, index) => [brand, index]));
        const countMap = new Map<string, number>();
        filteredGlobalNews.forEach((item) => {
            const brandName = getHeatmapBrandName(item.brand);
            if (!brandName) return;
            countMap.set(brandName, (countMap.get(brandName) || 0) + 1);
        });
        const counts = Array.from(countMap.entries()).map(([name, count]) => ({
            name,
            count,
            priority: priorityRank.get(name) ?? 999,
        }));
        const sortedBrands = counts
            .sort((a, b) => (b.count - a.count) || (a.priority - b.priority) || a.name.localeCompare(b.name))
            .map((brand) => brand.name);

        return sortedBrands.slice(0, 5);
    }, [filteredGlobalNews]);

    const heatmapData = useMemo(
        () => generateHeatmapData(filteredGlobalNews, topBrands, 28, heatmapBrandMatcher),
        [filteredGlobalNews, topBrands],
    );
    const heatmapDates = useMemo(() => Array.from(new Set(heatmapData.map((item) => item.date))).sort(), [heatmapData]);
    const heatmapRangeLabel = heatmapDates.length > 0 ? `${heatmapDates[0]} 至 ${heatmapDates[heatmapDates.length - 1]}` : '暂无数据';

    const brandCards = useMemo(() => {
        const coreFocusBrands = topBrands.length > 0 ? topBrands.slice(0, 4) : visibleBrands.slice(0, 4);
        return coreFocusBrands.map((brand) => getBrandProfile(brand, filteredGlobalNews, heatmapBrandMatcher));
    }, [filteredGlobalNews, topBrands, visibleBrands]);

    const latestNews = useMemo(
        () => filteredGlobalNews.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
        [filteredGlobalNews],
    );

    const getBrandColor = (brand: string) => {
        if (brand.includes('Changan')) return { text: 'text-blue-700', border: 'border-blue-200' };
        if (brand.includes('BYD')) return { text: 'text-indigo-700', border: 'border-indigo-200' };
        if (brand.includes('Toyota')) return { text: 'text-rose-700', border: 'border-rose-200' };
        if (brand.includes('Geely')) return { text: 'text-cyan-700', border: 'border-cyan-200' };
        return { text: 'text-slate-700', border: 'border-slate-200' };
    };

    const getBrandHue = (brand: string): number => {
        if (brand.includes('Changan')) return 217;
        if (brand.includes('BYD')) return 252;
        if (brand.includes('Toyota')) return 355;
        if (brand.includes('Geely')) return 188;
        if (brand.includes('MG')) return 25;
        if (brand.includes('Chery')) return 160;
        if (brand.includes('Nissan')) return 30;
        if (brand.includes('Hyundai')) return 200;
        if (brand.includes('Kia')) return 280;
        return 220;
    };

    const getIntensityStyle = (intensity: number, brand: string): React.CSSProperties => {
        if (intensity === 0) return { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' };
        const lightness = [85, 65, 45, 28][intensity - 1];
        const saturation = intensity === 1 ? 55 : 75;
        return { backgroundColor: `hsl(${getBrandHue(brand)}, ${saturation}%, ${lightness}%)` };
    };

    const getModeTitle = () => {
        switch (salesViewMode) {
            case SalesViewMode.CHANGAN_VS_CHALLENGERS:
                return '长安 VS 中国出海品牌';
            case SalesViewMode.CHANGAN_VS_INCUMBENTS:
                return '长安 VS 传统主流品牌';
            default:
                return 'UAE 全市场';
        }
    };

    return (
        <div className="p-6 lg:p-8 w-full bg-transparent flex flex-col gap-8 animate-fadeIn overflow-y-auto h-full scroll-smooth">
            <div className="flex justify-between items-end pb-4 border-b border-slate-200/60">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
                        市场动态总览
                        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-bold tracking-wide border border-blue-200/60 shadow-sm">
                            {getModeTitle()}
                        </span>
                    </h1>
                    <p className="text-[11px] text-slate-500 font-bold mt-2.5 tracking-[0.2em] uppercase">UAE Auto Market Intelligence</p>
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="品牌活跃度热力图" subtitle={`${heatmapRangeLabel} · 按实际记录 Top 5`} />
                <div className="overflow-x-auto custom-scrollbar pb-4">
                    <div className="min-w-max">
                        <div className="flex gap-1 mb-2 ml-[120px]">
                            {heatmapDates.map((date) => (
                                <div key={date} className="w-8 text-[9px] text-slate-400 font-medium -rotate-90 origin-bottom-left relative top-4 h-6">
                                    {date.substring(5)}
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1.5 mt-6">
                            {topBrands.length > 0 ? topBrands.map((brand) => (
                                <div key={brand} className="flex items-center gap-4 group">
                                    <div className={`w-[100px] text-right text-sm font-bold tracking-tight truncate transition-colors ${brand.includes('Changan') ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-800'}`} title={brand}>
                                        {getBrandShortName(brand)}
                                    </div>
                                    <div className="flex gap-1.5">
                                        {heatmapDates.map((date) => {
                                            const point = heatmapData.find((item) => item.brand === brand && item.date === date);
                                            const intensity = point ? point.intensity : 0;
                                            return (
                                                <div
                                                    key={`${brand}-${date}`}
                                                    title={`${brand} ${date}: ${point?.count || 0} 条`}
                                                    style={getIntensityStyle(intensity, brand)}
                                                    className="w-8 h-8 rounded shrink-0 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-md cursor-default"
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            )) : (
                                <div className="w-[680px] rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-10 text-center text-sm font-medium text-slate-400">
                                    当前筛选条件下暂无品牌情报
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 justify-end mt-6 items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Intensity</span>
                    <div className="flex gap-1.5 items-center">
                        <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }} />
                        <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'hsl(217,55%,85%)' }} />
                        <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'hsl(217,75%,65%)' }} />
                        <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'hsl(217,75%,45%)' }} />
                        <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: 'hsl(217,75%,28%)' }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Low → High</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
                <div className="min-h-[420px]">
                    <PolicyMonitor allNews={rawIntelligence} />
                </div>
                <div className="min-h-[420px]">
                    <PriceChangePreview items={filteredGlobalNews} />
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="核心竞品战报" subtitle="Snapshot" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {brandCards.map((card) => {
                        const brandStyle = getBrandColor(card.brand);
                        const isChangan = card.brand.includes('Changan');
                        return (
                            <div key={card.brand} className={`p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isChangan ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200/60' : 'bg-white border-slate-200/60'}`}>
                                <div className="flex justify-between items-center mb-4 gap-3">
                                    <h4 className={`font-black tracking-tight text-xl truncate ${brandStyle.text}`}>{getBrandShortName(card.brand)}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border ${card.statusColor}`}>{card.statusLabel}</span>
                                </div>
                                <div className="flex gap-6 mb-4 pb-4 border-b border-slate-100">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">News</div>
                                        <div className={`text-4xl font-black tracking-tighter ${isChangan ? 'text-blue-900' : 'text-slate-800'}`}>{card.totalNews}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Action</div>
                                        <div className={`text-3xl mt-1 font-black tracking-tighter ${isChangan ? 'text-blue-700/80' : 'text-slate-600'}`}>
                                            {(card.launchRatio * 100).toFixed(0)}<span className="text-sm text-slate-400 font-bold ml-1">%</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Keywords</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {card.topKeywords.length > 0 ? (
                                            card.topKeywords.map((keyword) => (
                                                <span key={keyword} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">{keyword}</span>
                                            ))
                                        ) : (
                                            <span className="text-[11px] text-slate-300 italic font-medium">近期暂无明显动作</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="实时滚动资讯" subtitle={`Filtered: ${filteredGlobalNews.length} items`} />
                <div className="divide-y divide-slate-100/80">
                    {latestNews.map((item) => {
                        const isChangan = item.brand.includes('Changan');
                        const brandStyle = getBrandColor(item.brand);
                        return (
                            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4 group transition-colors hover:bg-slate-50/50 -mx-4 px-4 rounded-xl">
                                <div className="shrink-0">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded bg-slate-50 border shadow-sm ${brandStyle.border} ${brandStyle.text}`}>
                                        {getBrandShortName(item.brand)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[15px] font-bold tracking-tight mb-1 truncate group-hover:text-blue-600 transition-colors ${isChangan ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {item.title}
                                    </p>
                                    <p className="text-[13px] text-slate-500 truncate leading-relaxed">{item.summary}</p>
                                </div>
                                <div className="shrink-0 sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                                    <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">{item.date}</span>
                                    {item.sentiment && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : item.sentiment === 'negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.sentiment === 'positive' ? '利好' : item.sentiment === 'negative' ? '利空' : '中性'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredGlobalNews.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-sm font-medium">当前筛选条件下没有情报数据。</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
