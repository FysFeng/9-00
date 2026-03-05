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

    const actualRadarA = visibleBrands.includes(radarBrandA) ? radarBrandA : (visibleBrands[0] || '');
    const actualRadarB = visibleBrands.includes(radarBrandB) ? radarBrandB : (visibleBrands.length > 1 ? visibleBrands[1] : visibleBrands[0] || '');

    const heatmapData = useMemo(() => generateHeatmapData(filteredGlobalNews, topBrands, 28), [filteredGlobalNews, topBrands]);
    const heatmapDates = useMemo(() => Array.from(new Set(heatmapData.map(d => d.date))).sort(), [heatmapData]);

    const brandCards = useMemo(() => {
        // Default dynamic to top active or just 4 visible if no activity
        const coreFocusBrands = topBrands.length > 0 ? topBrands.slice(0, 4) : visibleBrands.slice(0, 4);
        return coreFocusBrands.map(b => getBrandProfile(b, filteredGlobalNews));
    }, [filteredGlobalNews, topBrands, visibleBrands]);

    // Latest news (sorted by date desc)
    const latestNews = useMemo(() =>
        filteredGlobalNews.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
        [filteredGlobalNews]
    );

    // --- Helpers ---
    const getBrandColor = (brand: string) => {
        if (brand.includes('Changan')) return { bg: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-500', border: 'border-blue-200' };
        if (brand.includes('BYD')) return { bg: 'bg-indigo-500', text: 'text-indigo-700', ring: 'ring-indigo-500', border: 'border-indigo-200' };
        if (brand.includes('Toyota')) return { bg: 'bg-rose-600', text: 'text-rose-700', ring: 'ring-rose-500', border: 'border-rose-200' };
        if (brand.includes('Geely')) return { bg: 'bg-cyan-500', text: 'text-cyan-700', ring: 'ring-cyan-500', border: 'border-cyan-200' };
        return { bg: 'bg-slate-700', text: 'text-slate-700', ring: 'ring-slate-400', border: 'border-slate-200' };
    };

    const getIntensityColor = (intensity: number, brand: string) => {
        if (intensity === 0) return 'bg-slate-50 border border-slate-100';
        const color = getBrandColor(brand).bg.replace('bg-', '');
        switch (intensity) {
            case 1: return `bg-${color.replace(/\d+/, '100')} border border-${color.replace(/\d+/, '200')}`;
            case 2: return `bg-${color.replace(/\d+/, '300')}`;
            case 3: return `bg-${color.replace(/\d+/, '500')}`;
            case 4: return `bg-${color.replace(/\d+/, '700')}`;
            default: return 'bg-slate-50 border border-slate-100';
        }
    };

    const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                {title}
            </h3>
            {subtitle && <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-md border border-slate-200">{subtitle}</span>}
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
        <div className="p-6 lg:p-8 w-full bg-[#f8fafc] flex flex-col gap-8 animate-fadeIn overflow-y-auto h-full scroll-smooth">

            {/* Header */}
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

            {/* === 1. HEATMAP === */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="品牌活跃度热力图" subtitle="近 28 天情报分布" />

                <div className="overflow-x-auto custom-scrollbar pb-4">
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
                                    <div key={brand} className="flex items-center gap-4 group">
                                        <div className={`w-[100px] text-right text-sm font-bold tracking-tight truncate transition-colors ${isChangan ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-800'}`} title={brand}>
                                            {brand.split(' ')[0]}
                                        </div>
                                        <div className="flex gap-1.5">
                                            {heatmapDates.map(date => {
                                                const point = heatmapData.find(d => d.brand === brand && d.date === date);
                                                const intensity = point ? point.intensity : 0;
                                                const ringColor = getBrandColor(brand).ring;
                                                return (
                                                    <div
                                                        key={`${brand}-${date}`}
                                                        title={`${brand} on ${date}: ${point?.count || 0} 条`}
                                                        className={`w-8 h-8 rounded shrink-0 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-md cursor-default ${getIntensityColor(intensity, brand)}`}
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
                <div className="flex gap-4 justify-end mt-6 items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Intensity</span>
                    <div className="flex gap-1.5">
                        <div className="w-4 h-4 bg-slate-50 border border-slate-100 rounded"></div>
                        <div className="w-4 h-4 bg-slate-200 rounded"></div>
                        <div className="w-4 h-4 bg-slate-400 rounded"></div>
                        <div className="w-4 h-4 bg-slate-600 rounded"></div>
                    </div>
                </div>
            </div>

            {/* === 2. MIDDLE ROW: COMP RADAR & BATTLE CARDS === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Radar (Takes 4 cols) */}
                <div className="lg:col-span-5 bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 flex flex-col min-h-[400px]">
                    <SectionHeader title="品牌对比雷达" />
                    <CompetitorRadar
                        brandA={actualRadarA}
                        brandB={actualRadarB}
                        onBrandAChange={setRadarBrandA}
                        onBrandBChange={setRadarBrandB}
                        availableBrands={visibleBrands}
                        news={filteredGlobalNews}
                    />
                </div>

                {/* Right: Battle Cards (Takes 7 cols) */}
                <div className="lg:col-span-7 bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 flex flex-col">
                    <SectionHeader title="核心竞品战报" subtitle="Snapshot" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                        {brandCards.map((card, idx) => {
                            const brandStyle = getBrandColor(card.brand);
                            const isChangan = card.brand.includes("Changan");
                            return (
                                <div key={card.brand} className={`p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isChangan ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200/60 shadow-blue-900/5' : 'bg-white border-slate-200/60 shadow-slate-200/50'}`}>
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className={`font-black tracking-tight text-xl truncate pr-2 ${brandStyle.text}`}>{card.brand.split(' ')[0]}</h4>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded shadow-sm border ${card.statusColor}`}>
                                            {card.statusLabel}
                                        </span>
                                    </div>

                                    <div className="flex gap-8 mb-6 pb-6 border-b border-slate-100">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Total News</div>
                                            <div className={`text-5xl font-black tracking-tighter ${isChangan ? 'text-blue-900' : 'text-slate-800'}`}>{card.totalNews}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1.5">Action Vol.</div>
                                            <div className={`text-4xl mt-1 font-black tracking-tighter ${isChangan ? 'text-blue-700/80' : 'text-slate-600'}`}>{(card.launchRatio * 100).toFixed(0)}<span className="text-lg text-slate-400 font-bold ml-1">%</span></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Hot Keywords</div>
                                        <div className="flex flex-wrap gap-2">
                                            {card.topKeywords.length > 0 ? (
                                                card.topKeywords.map(k => (
                                                    <span key={k} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-md font-semibold tracking-tight shadow-sm">
                                                        {k}
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
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="实况滚动资讯" subtitle={`Filtered: ${filteredGlobalNews.length} items`} />
                <div className="divide-y divide-slate-100/80">
                    {latestNews.map(item => {
                        const isChangan = item.brand.includes("Changan");
                        const brandStyle = getBrandColor(item.brand);
                        return (
                            <div
                                key={item.id}
                                className={`py-4 flex flex-col sm:flex-row sm:items-center gap-4 group transition-colors hover:bg-slate-50/50 -mx-4 px-4 rounded-xl`}
                            >
                                <div className="shrink-0">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded bg-slate-50 border shadow-sm ${brandStyle.border} ${brandStyle.text}`}>
                                        {item.brand.split(' ')[0]}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[15px] font-bold tracking-tight mb-1 truncate group-hover:text-blue-600 transition-colors ${isChangan ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {item.title}
                                    </p>
                                    <p className="text-[13px] text-slate-500 truncate leading-relaxed">{item.summary}</p>
                                </div>
                                <div className="shrink-0 sm:text-right">
                                    <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">{item.date}</span>
                                </div>
                            </div>
                        );
                    })}
                    {filteredGlobalNews.length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-sm font-medium">No intelligence data found for current filters.</div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
