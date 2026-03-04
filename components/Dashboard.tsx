import React, { useMemo, useState } from 'react';
import { useIntelligenceStore, SalesViewMode } from '../src/store/useIntelligenceStore';
import { generateHeatmapData, getBrandProfile } from '../utils/dashboardHelpers';
import CompetitorRadar from '../src/components/charts/CompetitorRadar';

const Dashboard: React.FC = () => {
    // --- State Connection ---
    const { rawIntelligence, filters, customBrands, salesViewMode, focusedBrand } = useIntelligenceStore();

    const [radarBrandA, setRadarBrandA] = useState(focusedBrand);
    const [radarBrandB, setRadarBrandB] = useState('Chery 奇瑞');

    const visibleBrands = useMemo(() => {
        return filters.selectedBrands.length > 0 ? filters.selectedBrands : customBrands;
    }, [filters.selectedBrands, customBrands]);

    const filteredGlobalNews = useMemo(() => {
        return rawIntelligence.filter(item => {
            const startMatch = !filters.startDate || item.date >= filters.startDate;
            const endMatch = !filters.endDate || item.date <= filters.endDate;
            const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
            const brandMatch = visibleBrands.includes(item.brand);
            return startMatch && endMatch && typeMatch && brandMatch;
        });
    }, [rawIntelligence, filters.startDate, filters.endDate, filters.selectedTypes, visibleBrands]);

    // --- Data Preparation ---
    const topBrands = useMemo(() => {
        const counts = visibleBrands.map(b => ({
            name: b,
            count: filteredGlobalNews.filter(n => n.brand === b).length
        }));
        return counts.sort((a, b) => b.count - a.count).slice(0, 5).map(b => b.name);
    }, [visibleBrands, filteredGlobalNews]);

    const heatmapData = useMemo(() => generateHeatmapData(filteredGlobalNews, topBrands, 28), [filteredGlobalNews, topBrands]);
    const heatmapDates = useMemo(() => Array.from(new Set(heatmapData.map(d => d.date))).sort(), [heatmapData]);

    const brandCards = useMemo(() => {
        const coreFocusBrands = ["Changan 长安", "Chery 奇瑞", "Geely 吉利", "Jetour 捷途"];
        return coreFocusBrands.map(b => getBrandProfile(b, filteredGlobalNews));
    }, [filteredGlobalNews]);

    // Latest news (sorted by date desc)
    const latestNews = useMemo(() =>
        filteredGlobalNews.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
        [filteredGlobalNews]
    );

    // --- Helpers ---
    const getIntensityColor = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-slate-100';
            case 1: return 'bg-blue-100';
            case 2: return 'bg-blue-300';
            case 3: return 'bg-blue-500';
            case 4: return 'bg-blue-700';
            default: return 'bg-slate-100';
        }
    };

    const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                {title}
            </h3>
            {subtitle && <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">{subtitle}</span>}
        </div>
    );

    const getModeTitle = () => {
        switch (salesViewMode) {
            case SalesViewMode.CHANGAN_VS_CHALLENGERS: return "长安 VS 中国出海品牌";
            case SalesViewMode.CHANGAN_VS_INCUMBENTS: return "长安 VS 日韩传统品牌";
            default: return "阿联酋全市场";
        }
    };

    return (
        <div className="p-6 lg:p-10 min-h-full bg-slate-50 space-y-6 flex flex-col animate-fadeIn">

            {/* Header */}
            <div className="flex justify-between items-end pb-4 border-b border-slate-200/60">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                        市场动态总览
                        <span className="text-sm bg-blue-100 text-blue-700 px-2.5 py-1 rounded font-bold tracking-wide border border-blue-200">
                            {getModeTitle()}
                        </span>
                    </h1>
                    <p className="text-xs text-slate-500 font-bold mt-2 tracking-wider">UAE AUTO MARKET INTELLIGENCE</p>
                </div>
            </div>

            {/* === 1. HEATMAP === */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <SectionHeader title="各品牌近期活跃度" subtitle="近28天资讯发布频率" />

                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <div className="min-w-max">
                        <div className="flex gap-1 mb-2 ml-[120px]">
                            {heatmapDates.map(date => (
                                <div key={date} className="w-8 text-[9px] text-slate-400 font-medium -rotate-90 origin-bottom-left relative top-4 h-6">
                                    {date.substring(5)}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5 mt-6">
                            {topBrands.map(brand => {
                                const isChangan = brand.includes("Changan");
                                return (
                                    <div key={brand} className="flex items-center gap-4">
                                        <div className={`w-[100px] text-right text-xs font-bold truncate ${isChangan ? 'text-blue-700' : 'text-slate-600'}`} title={brand}>
                                            {brand}
                                        </div>
                                        <div className="flex gap-1">
                                            {heatmapDates.map(date => {
                                                const point = heatmapData.find(d => d.brand === brand && d.date === date);
                                                const intensity = point ? point.intensity : 0;
                                                return (
                                                    <div
                                                        key={`${brand}-${date}`}
                                                        title={`${brand} on ${date}: ${point?.count || 0} 条`}
                                                        className={`w-8 h-8 rounded-sm transition-all hover:ring-2 ring-slate-400 cursor-default ${getIntensityColor(intensity)}`}
                                                    ></div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 justify-end mt-4 items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">活跃度</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    </div>
                </div>
            </div>

            {/* === 2. MIDDLE ROW: COMP RADAR & BATTLE CARDS === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Radar */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <SectionHeader title="品牌对比分析" subtitle="多维度攻防重叠度" />
                    <CompetitorRadar
                        brandA={radarBrandA}
                        brandB={radarBrandB}
                        onBrandAChange={setRadarBrandA}
                        onBrandBChange={setRadarBrandB}
                        availableBrands={visibleBrands}
                        news={filteredGlobalNews}
                    />
                </div>

                {/* Right: Battle Cards */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <SectionHeader title="核心品牌快照" subtitle="四大关键出海品牌活跃度" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {brandCards.map((card, idx) => {
                            const isChangan = card.brand.includes("Changan");
                            return (
                                <div key={card.brand} className={`p-5 rounded-xl border transition-all duration-200 ${isChangan ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className={`font-black text-base truncate pr-2 ${isChangan ? 'text-blue-900' : 'text-slate-800'}`}>{card.brand}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.statusColor}`}>
                                            {card.statusLabel}
                                        </span>
                                    </div>

                                    <div className="flex gap-6 mb-4 pb-4 border-b border-slate-100/80">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">资讯数量</div>
                                            <div className="text-2xl font-black text-slate-700 tracking-tight">{card.totalNews}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">新品/促销占比</div>
                                            <div className="text-2xl font-black text-slate-700 tracking-tight">{(card.launchRatio * 100).toFixed(0)}<span className="text-sm text-slate-400 font-bold ml-0.5">%</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-2">近期关键词</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {card.topKeywords.length > 0 ? (
                                                card.topKeywords.map(k => (
                                                    <span key={k} className="text-[10px] bg-slate-100/80 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                                                        #{k}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[11px] text-slate-300 italic font-medium">近期无明显动作</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* === 3. LATEST NEWS === */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <SectionHeader title="最新动态" subtitle={`共 ${filteredGlobalNews.length} 条`} />
                <div className="divide-y divide-slate-100">
                    {latestNews.map(item => {
                        const isChangan = item.brand.includes("Changan");
                        return (
                            <div
                                key={item.id}
                                className={`py-3.5 flex items-start gap-4 ${isChangan ? 'bg-blue-50/30 -mx-6 px-6' : ''}`}
                            >
                                <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${isChangan ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {item.brand}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold leading-snug truncate ${isChangan ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {isChangan && <span className="mr-1.5 text-blue-500">▶</span>}
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{item.summary}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                                </div>
                            </div>
                        );
                    })}
                    {filteredGlobalNews.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-sm">暂无资讯，请在「添加资讯」处录入数据。</div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
