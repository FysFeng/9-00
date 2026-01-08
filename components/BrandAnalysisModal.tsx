import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LineChart, Line } from 'recharts';
import { NewsItem, NewsType, SentimentType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface BrandAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: string;
  allNews: NewsItem[];
}

const TYPE_COLORS: Record<string, string> = {
  [NewsType.LAUNCH]: '#3b82f6',
  [NewsType.POLICY]: '#ef4444',
  [NewsType.SALES]: '#10b981',
  [NewsType.PERSONNEL]: '#f59e0b',
  [NewsType.COMPETITOR]: '#8b5cf6',
  [NewsType.OTHER]: '#64748b'
};

const BrandAnalysisModal: React.FC<BrandAnalysisModalProps> = ({ isOpen, onClose, brand, allNews }) => {
  const [year, setYear] = useState(new Date().getFullYear());

  // Filter news for this brand and year
  const brandNews = useMemo(() => {
    return allNews.filter(item => 
      item.brand === brand && item.date.startsWith(String(year))
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [allNews, brand, year]);

  // 1. Monthly Rhythm Data (Stacked Bar)
  const rhythmData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: `${i + 1}月`,
      monthKey: String(i + 1).padStart(2, '0'),
      ...Object.values(NewsType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {})
    }));

    brandNews.forEach(item => {
      const monthIndex = parseInt(item.date.split('-')[1]) - 1;
      if (months[monthIndex]) {
        // @ts-ignore
        months[monthIndex][item.type] = (months[monthIndex][item.type] || 0) + 1;
      }
    });
    return months;
  }, [brandNews]);

  // 2. Sentiment Trend (Line Chart)
  // Calculate a cumulative score: Positive (+1), Negative (-1), Neutral (0)
  const sentimentData = useMemo(() => {
    let score = 0;
    return brandNews.map(item => {
      if (item.sentiment === 'positive') score += 1;
      if (item.sentiment === 'negative') score -= 1;
      return {
        date: item.date,
        title: item.title,
        score: score,
        sentiment: item.sentiment
      };
    });
  }, [brandNews]);

  // 3. Top Keywords (Tag Cloud Logic)
  const topTags = useMemo(() => {
    const tags: Record<string, number> = {};
    brandNews.forEach(item => {
      item.tags?.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });
    return Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [brandNews]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-3">
               <h2 className="text-2xl font-bold text-slate-800">{brand}</h2>
               <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded uppercase tracking-wider">Quarter-in-Review</span>
            </div>
            <p className="text-slate-500 text-sm mt-1">品牌年度战略节奏与声誉分析</p>
          </div>
          
          <div className="flex items-center gap-4">
             <select 
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-slate-100 border-none text-slate-700 font-bold rounded px-3 py-2 cursor-pointer focus:ring-2 focus:ring-red-500"
             >
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y} 年</option>)}
             </select>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
               <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-slate-50/50">
          
          {/* Section 1: Strategic Rhythm (Stacked Bar) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                战略节奏 (Strategic Rhythm)
             </h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={rhythmData} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                   <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                   <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                   <Tooltip 
                     cursor={{fill: '#f8fafc'}}
                     contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                   />
                   {Object.keys(TYPE_COLORS).map((type) => (
                     <Bar key={type} dataKey={type} stackId="a" fill={TYPE_COLORS[type]} radius={[0,0,0,0]} maxBarSize={40} />
                   ))}
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {Object.keys(TYPE_COLORS).map(type => (
                   <div key={type} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: TYPE_COLORS[type]}}></div>
                      <span className="text-[10px] text-slate-500 uppercase">{NEWS_TYPE_LABELS[type as NewsType]}</span>
                   </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Section 2: Sentiment Trend */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    声誉走势 (Reputation Trend)
                </h3>
                <div className="h-48">
                    {sentimentData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sentimentData}>
                                <XAxis dataKey="date" hide />
                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-slate-800 text-white text-xs p-2 rounded shadow-lg max-w-[200px]">
                                                <p className="font-bold mb-1">{data.date}</p>
                                                <p className="mb-1">{data.title}</p>
                                                <span className={`px-1 rounded ${data.sentiment === 'positive' ? 'bg-green-500' : data.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-500'}`}>
                                                    {data.sentiment}
                                                </span>
                                            </div>
                                        );
                                        }
                                        return null;
                                    }}
                                />
                                <Line type="stepAfter" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{r: 2}} activeDot={{r: 5}} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">暂无情感数据</div>
                    )}
                </div>
             </div>

             {/* Section 3: Keyword Cloud */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    年度关键词 (Narrative Cloud)
                </h3>
                <div className="flex flex-wrap gap-2 content-start h-48 overflow-y-auto">
                    {topTags.length > 0 ? topTags.map(([tag, count], i) => (
                        <span 
                            key={tag} 
                            className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full text-sm border border-slate-100 flex items-center gap-2"
                            style={{ opacity: Math.max(0.5, 1 - i * 0.05) }}
                        >
                            #{tag}
                            <span className="bg-slate-200 text-slate-500 text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">{count}</span>
                        </span>
                    )) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">暂无标签数据</div>
                    )}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BrandAnalysisModal;
