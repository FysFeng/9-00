import React, { useMemo, useState } from 'react';
import { useIntelligenceStore, SalesViewMode } from '../src/store/useIntelligenceStore';
import { generateHeatmapData, getBrandProfile } from '../utils/dashboardHelpers';
import CompetitorRadar from '../src/components/charts/CompetitorRadar';
import { NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

// ─── UAE Policy Monitor ───────────────────────────────────────────────────────
// Shows the latest Policy-type news items from the actual store data.
// Source: WAM, RTA, DEWA, MOEI press releases captured by the RSS collector.
function PolicyMonitor({ allNews }: { allNews: any[] }) {
    const policyNews = useMemo(() => {
        return allNews
            .filter(n => n.type === NewsType.POLICY || n.brand === '政策相关')
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);
    }, [allNews]);

    const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
        'rta': { label: 'RTA', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        'dewa': { label: 'DEWA', color: 'bg-green-100 text-green-700 border-green-200' },
        'wam': { label: 'WAM', color: 'bg-slate-100 text-slate-700 border-slate-200' },
        'moei': { label: 'MOEI', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    };

    const getSourceBadge = (source: string = '') => {
        const key = Object.keys(SOURCE_BADGES).find(k => source.toLowerCase().includes(k));
        return key ? SOURCE_BADGES[key] : { label: source || '官方', color: 'bg-red-50 text-red-700 border-red-200' };
    };

    return (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-6 lg:p-8">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                    UAE 政策动态监控
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sources: RTA · DEWA · WAM · MOEI</span>
                </div>
            </div>

            {policyNews.length === 0 ? (
                <div className="py-10 text-center">
                    <p className="text-slate-300 text-sm font-medium">暂无政策类资讯</p>
                    <p className="text-slate-300 text-xs mt-1">通过 RSS 采集或手动录入 Policy 类新闻后将在此显示</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {policyNews.map(item => {
                        const badge = getSourceBadge(item.source);
                        return (
                            <div key={item.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="shrink-0 mt-0.5">
                                    <span className="text-lg">🏛️</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 leading-snug truncate group-hover:text-blue-700 transition-colors">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.summary}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
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
        const coreFocusBrands = topBrands.length > 0 ? topBrands.slice(0, 4) : visibleBrands.slice(0, 4);
        return coreFocusBrands.map(b => getBrandProfile(b, filteredGlobalNews));
    }, [filteredGlobalNews, topBrands, visibleBrands]);

    const latestNews = useMemo(() =>
        filteredGlobalNews.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
        [filteredGlobalNews]
    );

    const getBrandColor = (brand: string) => {
        if (brand.includes('Changan')) return { bg: 'bg-blue-500', text: 'text-blue-700', ring: 'ring-blue-500', border: 'border-blue-200' };
        if (brand.includes('BYD')) return { bg: 'bg-indigo-500', text: 'text-indigo-700', ring: 'ring-indigo-500', border: 'border-indigo-200' };
        if (brand.includes('Toyota')) return { bg: 'bg-rose-600', text: 'text-rose-700', ring: 'ring-rose-500', border: 'border-rose-200' };
        if (brand.includes('Geely')) return { bg: 'bg-cyan-500', text: 'text-cyan-700', ring: 'ring-cyan-500', border: 'border-cyan-200' };
        return { bg: 'bg-slate-700', text: 'text-slate-700', ring: 'ring-slate-400', border: 'border-slate-200' };
    };

    // Map brand → hue (HSL) for the heatmap.
    const getBrandHue = (brand: string): number => {
        if (brand.includes('Changan'))   return 217; // blue
        if (brand.includes('BYD'))       return 252; // indigo
        if (brand.includes('Toyota'))    return 355; // red
        if (brand.includes('Geely'))     return 188; // cyan
        if (brand.includes('MG'))        return 25;  // orange
        if (brand.includes('Chery'))     return 160; // teal
        if (brand.includes('Nissan'))    return 30;  // amber
        if (brand.includes('Hyundai'))   return 200; // sky
        if (brand.includes('Kia'))       return 280; // purple
        if (brand.includes('Tesla'))     return 0;   // rose
        return 220; // default slate-blue
    };

    // Returns an inline style object — avoids PurgeCSS stripping dynamic Tailwind classes.
    const getIntensityStyle = (intensity: number, brand: string): React.CSSProperties => {
        if (intensity === 0) return { backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' };
        const hue = getBrandHue(brand);
        // intensity 1-4 → lightness 85% → 30% (more distinct range)
        const lightness = [85, 65, 45, 28][intensity - 1];
        const saturation = intensity === 1 ? 55 : 75;
        return { backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` };
    };

    const SectionHeader = ({ title, subtitle, accent }: { title: string, subtitle?: string, accent?: string }) => (
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
                <div className={`w-1 h-5 ${accent || 'bg-gradient-to-b from-blue-500 to-indigo-600'} rounded-full`}></div>
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
        <div className="p-6 lg:p-8 w-full bg-transparent flex flex-col gap-8 animate-fadeIn overflow-y-auto h-full scroll-smooth">

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
                                                return (
                                                    <div
                                                        key={`${brand}-${date}`}
                                                        title={`${brand} on ${date}: ${point?.count || 0} 条`}
                                                        style={getIntensityStyle(intensity, brand)}
                                                        className="w-8 h-8 rounded shrink-0 transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-md cursor-default"
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

            {/* === 2. RADAR (full width) + POLICY MONITOR (sidebar) === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Competitor Radar — full 7 cols */}
                <div className="lg:col-span-7 bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 flex flex-col min-h-[400px]">
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

                {/* Policy Monitor — 5 cols */}
                <div className="lg:col-span-5">
                    <PolicyMonitor allNews={rawIntelligence} />
                </div>

            </div>

            {/* === 3. BATTLE CARDS === */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="核心竞品战报" subtitle="Snapshot" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {brandCards.map((card) => {
                        const brandStyle = getBrandColor(card.brand);
                        const isChangan = card.brand.includes("Changan");
                        return (
                            <div key={card.brand} className={`p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isChangan ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200/60' : 'bg-white border-slate-200/60'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className={`font-black tracking-tight text-xl truncate pr-2 ${brandStyle.text}`}>{card.brand.split(' ')[0]}</h4>
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
                                            card.topKeywords.map(k => (
                                                <span key={k} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">{k}</span>
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

            {/* === 4. LATEST NEWS === */}
            <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
                <SectionHeader title="实况滚动资讯" subtitle={`Filtered: ${filteredGlobalNews.length} items`} />
                <div className="divide-y divide-slate-100/80">
                    {latestNews.map(item => {
                        const isChangan = item.brand.includes("Changan");
                        const brandStyle = getBrandColor(item.brand);
                        return (
                            <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4 group transition-colors hover:bg-slate-50/50 -mx-4 px-4 rounded-xl">
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
                                <div className="shrink-0 sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                                    <span className="text-[11px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">{item.date}</span>
                                    {item.sentiment && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-600' : item.sentiment === 'negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.sentiment === 'positive' ? '📈 利好' : item.sentiment === 'negative' ? '📉 利空' : '➖ 中性'}
                                        </span>
                                    )}
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
