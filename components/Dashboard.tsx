import React, { useMemo, useState } from 'react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { NewsItem, FilterState } from '../types';
import { generateHeatmapData, getBrandProfile, getRadarData } from '../utils/dashboardHelpers';

interface DashboardProps {
    news: NewsItem[];
    availableBrands: string[];
    onDrillDown: (brand?: string) => void;
    filters: FilterState;
    onFilterChange: (newFilters: FilterState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ news, availableBrands, onFilterChange }) => {
    // --- State ---
    const [radarBrandA, setRadarBrandA] = useState(availableBrands[0] || 'Toyota 丰田');
    const [radarBrandB, setRadarBrandB] = useState(availableBrands[1] || 'BYD 比亚迪');

    // --- Data Preparation ---
    // Dynamic Top Brands based on activity (news count)
    const topBrands = useMemo(() => {
        const counts = availableBrands.map(b => ({
            name: b,
            count: news.filter(n => n.brand === b).length
        }));
        return counts.sort((a, b) => b.count - a.count).slice(0, 5).map(b => b.name);
    }, [availableBrands, news]);

    // 1. Heatmap Data (Last 14 days, Top 5 brands)
    const heatmapData = useMemo(() => generateHeatmapData(news, topBrands, 28), [news, topBrands]);
    const heatmapDates = useMemo(() => Array.from(new Set(heatmapData.map(d => d.date))).sort(), [heatmapData]);

    // 2. Radar Data
    const radarData = useMemo(() => getRadarData(radarBrandA, radarBrandB, news), [radarBrandA, radarBrandB, news]);

    // 3. Brand Cards Data (Dynamic Top 6)
    const brandCards = useMemo(() => {
        // Sort brands by news count for cards too
        const counts = availableBrands.map(b => ({
            name: b,
            count: news.filter(n => n.brand === b).length
        }));
        return counts.sort((a, b) => b.count - a.count).slice(0, 6).map(b => getBrandProfile(b.name, news));
    }, [availableBrands, news]);

    // --- Helpers ---
    const getIntensityColor = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-slate-100'; // Empty
            case 1: return 'bg-blue-200';
            case 2: return 'bg-blue-400';
            case 3: return 'bg-blue-600'; // High
            case 4: return 'bg-blue-800'; // Extreme
            default: return 'bg-slate-100';
        }
    };

    const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
                {title}
            </h3>
            {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
        </div>
    );

    return (
        <div className="p-6 min-h-full bg-[#f1f5f9] space-y-6 flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">数据看板 (Data Dashboard)</h1>
                    <p className="text-xs text-slate-500 font-bold mt-1 tracking-wider">MARKET OVERVIEW • BRAND ANALYSIS</p>
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-200 px-2 py-1 rounded">
                    LIVE DATA SOURCE: OFFICIAL MEDIA
                </div>
            </div>

            {/* === 1. MARKET RHYTHM MAP (Heatmap) === */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <SectionHeader title="活跃热力图 (Activity Heatmap)" subtitle="Who is active right now? (Last 28 Days)" />

                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <div className="min-w-max">
                        {/* Dates Header */}
                        <div className="flex gap-1 mb-2 ml-[120px]">
                            {heatmapDates.map(date => (
                                <div key={date} className="w-8 text-[9px] text-slate-300 -rotate-90 origin-bottom-left relative top-4 h-6">
                                    {date.substring(5)}
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        <div className="space-y-1.5 mt-6">
                            {topBrands.map(brand => (
                                <div key={brand} className="flex items-center gap-4">
                                    <div className="w-[100px] text-right text-xs font-bold text-slate-600 truncate" title={brand}>
                                        {brand}
                                    </div>
                                    <div className="flex gap-1">
                                        {heatmapDates.map(date => {
                                            const point = heatmapData.find(d => d.brand === brand && d.date === date);
                                            const intensity = point ? point.intensity : 0;
                                            return (
                                                <div
                                                    key={`${brand}-${date}`}
                                                    title={`${brand} on ${date}: ${point?.count || 0} news`}
                                                    className={`w-8 h-8 rounded-sm transition-all hover:ring-2 ring-slate-400 cursor-default ${getIntensityColor(intensity)}`}
                                                ></div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 justify-end mt-4 items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Activity Intensity</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-slate-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                        <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                    </div>
                </div>
            </div>

            {/* === 2. SPLIT VIEW: RADAR + BATTLE CARDS === */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">

                {/* LEFT: STRATEGY GAP RADAR (5/12) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
                    <SectionHeader title="重叠雷达 (Overlap Radar)" subtitle="Compare Focus Areas" />

                    {/* Controls */}
                    <div className="flex gap-3 mb-4 justify-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <select
                            className="bg-white border border-blue-200 text-blue-800 text-xs font-bold rounded px-2 py-1.5 outline-none shadow-sm"
                            value={radarBrandA}
                            onChange={e => setRadarBrandA(e.target.value)}
                        >
                            {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <span className="text-slate-300 font-black italic">VS</span>
                        <select
                            className="bg-white border border-red-200 text-red-800 text-xs font-bold rounded px-2 py-1.5 outline-none shadow-sm"
                            value={radarBrandB}
                            onChange={e => setRadarBrandB(e.target.value)}
                        >
                            {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-h-0 relative -ml-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar name={radarBrandA} dataKey="A" stroke="#2563eb" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                                <Radar name={radarBrandB} dataKey="B" stroke="#dc2626" strokeWidth={3} fill="#ef4444" fillOpacity={0.1} />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: BATTLE CARDS GRID (7/12) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col">
                    <SectionHeader title="品牌概览 (Brand Overview)" subtitle="Status & Key Moves" />

                    <div className="overflow-y-auto custom-scrollbar flex-1 pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            {brandCards.map(card => (
                                <div key={card.brand} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-bold text-slate-800 text-sm truncate pr-2">{card.brand}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.statusColor}`}>
                                            {card.statusLabel}
                                        </span>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="flex gap-4 mb-3 pb-3 border-b border-slate-100">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Total News</div>
                                            <div className="text-xl font-black text-slate-700">{card.totalNews}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Offensive</div>
                                            <div className="text-xl font-black text-slate-700">{(card.launchRatio * 100).toFixed(0)}<span className="text-xs text-slate-400">%</span></div>
                                        </div>
                                    </div>

                                    {/* Keywords */}
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">Top Signals</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {card.topKeywords.length > 0 ? (
                                                card.topKeywords.map(k => (
                                                    <span key={k} className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded shadow-sm">
                                                        #{k}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-slate-300 italic">No signals detected</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
