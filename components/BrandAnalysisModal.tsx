import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line } from 'recharts';
import { NewsItem, NewsType } from '../types';
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

  const brandNews = useMemo(() => {
    return allNews.filter(item => 
      item.brand === brand && item.date.startsWith(String(year))
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [allNews, brand, year]);

  const rhythmData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      name: `${i + 1}月`,
      monthKey: String(i + 1).padStart(2, '0'),
      ...Object.values(NewsType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {})
    }));
    brandNews.forEach(item => {
      const monthIndex = parseInt(item.date.split('-')[1]) - 1;
      // @ts-ignore
      if (months[monthIndex]) months[monthIndex][item.type] = (months[monthIndex][item.type] || 0) + 1;
    });
    return months;
  }, [brandNews]);

  const sentimentData = useMemo(() => {
    let score = 0;
    return brandNews.map(item => {
      if (item.sentiment === 'positive') score += 1;
      if (item.sentiment === 'negative') score -= 1;
      return { date: item.date, title: item.title, score, sentiment: item.sentiment };
    });
  }, [brandNews]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{brand} 品牌复盘</h2>
          </div>
          <div className="flex gap-4">
             <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-100 rounded px-3 py-2">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}年</option>)}
             </select>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
          </div>
        </div>

        <div className="p-8 space-y-8 bg-slate-50/50">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-bold text-slate-800 mb-6">品牌动作节奏 (Activity Rhythm)</h3>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={rhythmData}>
                   <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                   <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                   <Tooltip />
                   {Object.keys(TYPE_COLORS).map((type) => (
                     <Bar key={type} dataKey={type} stackId="a" name={NEWS_TYPE_LABELS[type as NewsType]} fill={TYPE_COLORS[type]} />
                   ))}
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-6">市场声誉走势 (Reputation Trend)</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sentimentData}>
                            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                            <Tooltip />
                            <Line type="stepAfter" name="情感得分" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{r: 2}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default BrandAnalysisModal;
