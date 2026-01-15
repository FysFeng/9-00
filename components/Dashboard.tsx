import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend, Cell, LabelList,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { NewsItem, NewsType, FilterState } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface DashboardProps {
  news: NewsItem[];
  availableBrands: string[];
  onDrillDown: (brand?: string) => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
}

// Quick BI / Ant Design Color Palette
const COLORS = {
  blue: '#1890ff',
  green: '#52c41a',
  gold: '#faad14',
  red: '#f5222d',
  purple: '#722ed1',
  cyan: '#13c2c2',
  gray: '#f0f2f5',
  darkGray: '#bfbfbf'
};

const TYPE_COLORS: Record<string, string> = {
  [NewsType.LAUNCH]: COLORS.blue,
  [NewsType.POLICY]: COLORS.red,
  [NewsType.SALES]: COLORS.green,
  [NewsType.PERSONNEL]: COLORS.gold,
  [NewsType.COMPETITOR]: COLORS.purple,
  [NewsType.OTHER]: '#8c8c8c'
};

// --- 1. GEO MAP COMPONENT (Light Theme) ---
const UaeTechMap = ({ data, news }: { data: { location: string; count: number }[], news: NewsItem[] }) => {
  const [hoveredLoc, setHoveredLoc] = useState<string | null>(null);

  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  const locationIntel = useMemo(() => {
    if (!hoveredLoc) return [];
    const locNews = news.filter(n => {
        const text = (n.title + n.summary + n.source).toLowerCase();
        return text.includes(hoveredLoc.toLowerCase()) || 
               (hoveredLoc === 'Abu Dhabi' && text.includes('capital')) ||
               (hoveredLoc === 'Ras Al Khaimah' && text.includes('rak')) ||
               (hoveredLoc === 'Umm Al Quwain' && text.includes('uaq'));
    });
    const tagCounts: Record<string, number> = {};
    locNews.forEach(n => { n.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1); });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
  }, [hoveredLoc, news]);

  const locations: Record<string, { x: number; y: number; label: string; cnName: string }> = {
    'Abu Dhabi': { x: 30, y: 78, label: 'ABU DHABI', cnName: '阿布扎比' },
    'Dubai': { x: 78, y: 38, label: 'DUBAI', cnName: '迪拜' },
    'Sharjah': { x: 84, y: 32, label: 'SHJ', cnName: '沙迦' },
    'Ajman': { x: 88, y: 28, label: 'AJM', cnName: '阿治曼' },
    'Umm Al Quwain': { x: 92, y: 24, label: 'UAQ', cnName: '乌姆盖万' },
    'Ras Al Khaimah': { x: 96, y: 16, label: 'RAK', cnName: '哈伊马角' },
    'Fujairah': { x: 105, y: 40, label: 'FUJ', cnName: '富查伊拉' },
  };

  const getVisuals = (loc: string) => {
    const item = data.find(d => d.location === loc);
    const count = item?.count || 0;
    const ratio = count / maxCount;
    const radius = count === 0 ? 2 : 4 + (ratio * 15); 
    
    let color = COLORS.darkGray;
    if (count > 0) {
        if (ratio < 0.2) color = COLORS.blue;
        else if (ratio < 0.6) color = COLORS.gold;
        else color = COLORS.red;
    }
    return { radius, color, count };
  };

  return (
    <div className="w-full h-full relative rounded-lg flex items-center justify-center">
      {/* Increased ViewBox to prevent clipping of edges and tooltips/animations */}
      <svg viewBox="-10 -10 160 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Map Outline - Light Gray */}
        <path d="M 20 85 L 10 70 L 15 60 L 50 50 L 70 40 L 85 35 L 95 10 L 110 15 L 115 40 L 100 50 L 90 45 L 75 55 L 60 75 L 40 90 Z" 
              fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Connectors */}
        <line x1="30" y1="78" x2="78" y2="38" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="78" y1="38" x2="105" y2="40" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2 2" />
        
        {Object.keys(locations).map(loc => {
          const { radius, color, count } = getVisuals(loc);
          const isHovered = hoveredLoc === loc;
          
          // Visual radius expands on hover
          const displayRadius = isHovered ? radius + 2 : radius;

          return (
            <g 
                key={loc} 
                className="cursor-pointer" 
                onMouseEnter={() => setHoveredLoc(loc)} 
                onMouseLeave={() => setHoveredLoc(null)}
                style={{ pointerEvents: 'all' }}
            >
                {/* 
                   CRITICAL FIX: Invisible Hit Area 
                   A large, static transparent circle that captures mouse events. 
                   This prevents jitter when visual elements change size or move.
                */}
                <circle 
                    cx={locations[loc].x} 
                    cy={locations[loc].y} 
                    r={radius + 15} // Large hit area
                    fill="transparent" 
                />

                {/* Ping Animation - pointer-events-none */}
                {count > 0 && isHovered && (
                     <circle 
                        cx={locations[loc].x} 
                        cy={locations[loc].y} 
                        r={radius + 6} 
                        fill={color} 
                        opacity="0.2" 
                        className="animate-ping pointer-events-none" 
                        style={{ animationDuration: '2s' }} 
                     />
                )}
                
                {/* Main Visual Circle - pointer-events-none */}
                <circle 
                    cx={locations[loc].x} 
                    cy={locations[loc].y} 
                    r={displayRadius} 
                    fill={color} 
                    opacity={0.9} 
                    stroke="#fff" 
                    strokeWidth={1.5} 
                    className="transition-all duration-300 pointer-events-none" 
                />
                
                {/* Text Label - pointer-events-none */}
                {/* FIX: Use static 'radius' for Y position to prevent text jumping up/down on hover */}
                {(count > 0 || isHovered) && (
                    <text 
                        x={locations[loc].x} 
                        y={locations[loc].y + radius + 8} 
                        fontSize="4" 
                        fill="#475569" 
                        textAnchor="middle" 
                        fontWeight="bold" 
                        className="uppercase tracking-wider pointer-events-none select-none"
                    >
                        {locations[loc].label}
                    </text>
                )}
            </g>
          );
        })}
      </svg>
      {/* Tooltip Overlay - already has pointer-events-none */}
      {hoveredLoc && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-lg shadow-xl z-20 min-w-[120px] pointer-events-none animate-fadeIn">
              <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1 flex justify-between">
                  {locations[hoveredLoc].cnName} <span className="text-blue-600 font-mono">{getVisuals(hoveredLoc).count}</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                  {locationIntel.length > 0 ? locationIntel.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">#{tag}</span>
                  )) : <span className="text-[10px] text-slate-400">无相关标签</span>}
              </div>
          </div>
      )}
    </div>
  );
};

// --- MAIN DASHBOARD ---
const Dashboard: React.FC<DashboardProps> = ({ news, availableBrands, onDrillDown, filters, onFilterChange }) => {
  const [compareBrandA, setCompareBrandA] = useState('Changan');
  const [compareBrandB, setCompareBrandB] = useState('BYD');
  const [activeTime, setActiveTime] = useState<'7D' | '30D' | 'YTD' | 'ALL'>('ALL');

  // --- Date Handling ---
  const handleTimePreset = (period: '7D' | '30D' | 'YTD' | 'ALL') => {
      setActiveTime(period);
      const today = new Date();
      const endStr = today.toISOString().split('T')[0];
      let startStr = '';

      if (period === 'ALL') {
          onFilterChange({ ...filters, startDate: '', endDate: endStr });
          return;
      }
      if (period === 'YTD') {
          startStr = `${today.getFullYear()}-01-01`;
      } else {
          const days = period === '7D' ? 7 : 30;
          const start = new Date();
          start.setDate(today.getDate() - days);
          startStr = start.toISOString().split('T')[0];
      }
      onFilterChange({ ...filters, startDate: startStr, endDate: endStr });
  };

  // --- Data Prep ---
  const kpis = useMemo(() => {
    const total = news.length;
    const counts: Record<string, number> = {};
    news.forEach(n => counts[n.brand] = (counts[n.brand] || 0) + 1);
    const sortedBrands = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topBrand = sortedBrands[0] || ['N/A', 0];
    const sentimentScore = Math.round((news.filter(n => n.sentiment === 'positive').length / total) * 100) || 0;
    return { total, topBrand, sentimentScore };
  }, [news]);

  const mapData = useMemo(() => {
    const counts: Record<string, number> = { 'Abu Dhabi': 0, 'Dubai': 0, 'Sharjah': 0, 'Ajman': 0, 'Umm Al Quwain': 0, 'Ras Al Khaimah': 0, 'Fujairah': 0 };
    news.forEach(n => {
      const text = (n.title + n.summary + n.source).toLowerCase();
      if (text.includes('abu dhabi') || text.includes('capital')) counts['Abu Dhabi']++;
      else if (text.includes('dubai')) counts['Dubai']++;
      else if (text.includes('sharjah')) counts['Sharjah']++;
      else if (text.includes('ajman')) counts['Ajman']++;
      else if (text.includes('uaq')) counts['Umm Al Quwain']++;
      else if (text.includes('rak')) counts['Ras Al Khaimah']++;
      else if (text.includes('fujairah')) counts['Fujairah']++;
    });
    return Object.entries(counts).map(([location, count]) => ({ location, count }));
  }, [news]);

  const brandShareData = useMemo(() => {
      const counts: Record<string, number> = {};
      news.forEach(n => counts[n.brand] = (counts[n.brand] || 0) + 1);
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));
  }, [news]);

  const tagData = useMemo(() => {
      const tagCounts: Record<string, number> = {};
      news.forEach(n => n.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
      return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [news]);

  const trendData = useMemo(() => {
    const newsA = news.filter(n => n.brand === compareBrandA);
    const newsB = news.filter(n => n.brand === compareBrandB);
    const dateMap: Record<string, any> = {};
    
    [...newsA, ...newsB].forEach(n => {
        const d = n.date.substring(5); // MM-DD
        if (!dateMap[d]) dateMap[d] = { date: d, [compareBrandA]: 0, [compareBrandB]: 0 };
    });

    newsA.forEach(n => dateMap[n.date.substring(5)][compareBrandA]++);
    newsB.forEach(n => dateMap[n.date.substring(5)][compareBrandB]++);

    return Object.values(dateMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [news, compareBrandA, compareBrandB]);

  // --- UI Components ---
  const CardHeader = ({ title, extra }: { title: string, extra?: React.ReactNode }) => (
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 relative z-10">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              {title}
          </h3>
          {extra}
      </div>
  );

  return (
    // FIX: Changed min-h-screen to min-h-full to prevent excessive vertical spacing
    <div className="p-6 min-h-full bg-[#f0f2f5] space-y-4">
      
      {/* 1. Top Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
             <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">UAE 汽车市场情报驾驶舱</h1>
             <p className="text-xs text-slate-500 mt-1">实时数据监控与竞品分析中心</p>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
             {(['7D', '30D', 'YTD', 'ALL'] as const).map(t => (
                 <button
                    key={t}
                    onClick={() => handleTimePreset(t)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                        activeTime === t 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                 >
                     {t}
                 </button>
             ))}
         </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* === LEFT COLUMN (3/12) === */}
          <div className="md:col-span-3 space-y-4">
              {/* Brand Share */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 h-[320px] flex flex-col overflow-hidden">
                  <CardHeader title="品牌声量份额" />
                  <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={brandShareData} margin={{ left: 0, right: 30, bottom: 0 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                  {brandShareData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index < 3 ? COLORS.blue : COLORS.darkGray} />
                                  ))}
                                  <LabelList dataKey="value" position="right" fontSize={12} fill="#94a3b8" />
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Hot Topics */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 h-[400px] flex flex-col overflow-hidden">
                  <CardHeader title="市场热词" />
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                      {tagData.map((item, idx) => (
                          <div 
                            key={item[0]} 
                            onClick={() => onFilterChange({ ...filters, searchQuery: item[0] })}
                            className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors"
                            title="点击筛选相关新闻"
                          >
                              <div className="flex items-center gap-3">
                                  <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                                      idx === 0 ? 'bg-red-100 text-red-600' :
                                      idx === 1 ? 'bg-orange-100 text-orange-600' :
                                      idx === 2 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                      {idx + 1}
                                  </span>
                                  <span className="text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors">{item[0]}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500 rounded-full" 
                                        style={{ width: `${(item[1] / tagData[0][1]) * 100}%` }}
                                      ></div>
                                  </div>
                                  <span className="text-xs text-slate-400 w-4 text-right">{item[1]}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* === CENTER COLUMN (6/12) === */}
          <div className="md:col-span-6 space-y-4">
              
              {/* Geo Map */}
              {/* FIX: Removed overflow-hidden so tooltips are not clipped ("Blocked") */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 h-[400px] flex flex-col relative z-0">
                   <div className="absolute top-5 left-5 z-10 pointer-events-none">
                       <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                           <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                           区域活跃热力
                       </h3>
                   </div>
                   <div className="flex-1">
                       <UaeTechMap data={mapData} news={news} />
                   </div>
                   {/* Map Legend Overlay */}
                   <div className="absolute bottom-5 right-5 bg-white/80 backdrop-blur p-2 rounded border border-slate-100 text-[10px] space-y-1 shadow-sm pointer-events-none">
                       <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span>高活跃</div>
                       <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>中活跃</div>
                       <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span>低活跃</div>
                   </div>
              </div>

              {/* Competitor Analysis */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 h-[320px] flex flex-col overflow-hidden relative z-0">
                  <CardHeader 
                    title="竞品声量趋势对比" 
                    extra={
                        <div className="flex gap-2 relative z-20">
                             <select 
                                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-100 transition-colors"
                                value={compareBrandA} 
                                onChange={(e) => setCompareBrandA(e.target.value)}
                             >
                                {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                             </select>
                             <span className="text-slate-400 text-xs self-center">VS</span>
                             <select 
                                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer hover:bg-slate-100 transition-colors"
                                value={compareBrandB} 
                                onChange={(e) => setCompareBrandB(e.target.value)}
                             >
                                {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                             </select>
                        </div>
                    }
                  />
                  <div className="flex-1 min-h-0 relative z-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{fontSize: 11, fill: '#94a3b8'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} minTickGap={30} />
                              <YAxis tick={{fontSize: 11, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 500}}/>
                              <Area type="monotone" dataKey={compareBrandA} stroke={COLORS.blue} strokeWidth={2} fillOpacity={1} fill="url(#colorA)" activeDot={{r: 5, strokeWidth: 0}} />
                              <Area type="monotone" dataKey={compareBrandB} stroke={COLORS.gold} strokeWidth={2} fillOpacity={1} fill="url(#colorB)" activeDot={{r: 5, strokeWidth: 0}} />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          {/* === RIGHT COLUMN (3/12) === */}
          <div className="md:col-span-3 space-y-4">
              {/* KPI Group */}
              <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center h-28 relative overflow-hidden group">
                      <div className="text-xs text-slate-500 font-bold uppercase z-10">累计情报总量</div>
                      <div className="text-4xl font-extrabold text-slate-800 mt-1 z-10">{kpis.total}</div>
                      <div className="text-xs text-emerald-500 mt-1 font-medium z-10 flex items-center gap-1">
                          <span className="bg-emerald-100 px-1 rounded">实时</span> 自动同步中
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-50 rounded-full opacity-50 z-0"></div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center h-28 relative overflow-hidden">
                      <div className="text-xs text-slate-500 font-bold uppercase z-10">头部品牌活跃度</div>
                      <div className="text-2xl font-extrabold text-slate-800 mt-1 z-10 truncate" title={kpis.topBrand[0]}>
                          {kpis.topBrand[0]}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-medium z-10">
                          {kpis.topBrand[1]} 条情报信号
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-50 rounded-full opacity-50 z-0"></div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col justify-center h-28 relative overflow-hidden">
                      <div className="text-xs text-slate-500 font-bold uppercase z-10">情感指数</div>
                      <div className="text-4xl font-extrabold text-slate-800 mt-1 z-10">{kpis.sentimentScore}%</div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 z-10 overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${kpis.sentimentScore}%` }}></div>
                      </div>
                  </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 h-[340px] flex flex-col overflow-hidden">
                  <CardHeader title="情报类型分布" />
                  <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                             { subject: '新品', A: news.filter(n=>n.type===NewsType.LAUNCH).length, fullMark: 10 },
                             { subject: '销量', A: news.filter(n=>n.type===NewsType.SALES).length, fullMark: 10 },
                             { subject: '政策', A: news.filter(n=>n.type===NewsType.POLICY).length, fullMark: 10 },
                             { subject: '竞品', A: news.filter(n=>n.type===NewsType.COMPETITOR).length, fullMark: 10 },
                             { subject: '人事', A: news.filter(n=>n.type===NewsType.PERSONNEL).length, fullMark: 10 },
                         ]}>
                             <PolarGrid stroke="#f0f0f0" />
                             <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                             <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                             <Radar name="Count" dataKey="A" stroke={COLORS.cyan} strokeWidth={2} fill={COLORS.cyan} fillOpacity={0.2} />
                             <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                         </RadarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Dashboard;
