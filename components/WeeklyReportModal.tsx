import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNews: NewsItem[];
}

const TYPE_COLORS: Record<string, string> = {
  [NewsType.LAUNCH]: '#3b82f6', // Blue
  [NewsType.POLICY]: '#ef4444', // Red
  [NewsType.SALES]: '#10b981',  // Green
  [NewsType.PERSONNEL]: '#f59e0b', // Orange
  [NewsType.COMPETITOR]: '#8b5cf6', // Purple
  [NewsType.OTHER]: '#64748b'    // Gray
};

const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, allNews }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter news based on date range
  const filteredNews = useMemo(() => {
    return allNews.filter(item => 
      item.date >= startDate && item.date <= endDate
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [allNews, startDate, endDate]);

  // Group by Type
  const newsByType = useMemo(() => {
    const groups: Partial<Record<NewsType, NewsItem[]>> = {};
    filteredNews.forEach(item => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type]!.push(item);
    });
    return groups;
  }, [filteredNews]);

  // Chart Data: Type Distribution
  const typeChartData = useMemo(() => {
    return Object.entries(newsByType)
      .map(([type, items]) => ({
        name: NEWS_TYPE_LABELS[type as NewsType],
        value: items!.length,
        color: TYPE_COLORS[type] || '#ccc'
      }))
      .sort((a, b) => b.value - a.value);
  }, [newsByType]);

  // Chart Data: Top Brands
  const brandChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredNews.forEach(item => {
      counts[item.brand] = (counts[item.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [filteredNews]);

  const handleGenerate = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Render wait
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false
      });
      
      setGeneratedImage(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error("Image generation failed", error);
      alert("生成图片失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden border border-slate-800/50">
        
        {/* Left Control Panel */}
        <div className="w-full md:w-1/3 p-8 bg-white border-r border-slate-100 flex flex-col overflow-y-auto z-10">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">📊 报告生成器</h2>
               <p className="text-xs text-slate-500 mt-1">定制并导出您的周报</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8 flex-1">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">时间周期</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <span className="text-[10px] text-slate-400">开始日期</span>
                   <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setGeneratedImage(null); }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] text-slate-400">结束日期</span>
                   <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setGeneratedImage(null); }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase">当前内容统计</span>
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">{filteredNews.length} 篇新闻</span>
              </div>
              <div className="space-y-2">
                 {typeChartData.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                       <span className="text-slate-500">{item.name}</span>
                       <div className="flex-1 mx-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(item.value / filteredNews.length) * 100}%` }}></div>
                       </div>
                       <span className="font-medium text-slate-700">{item.value}</span>
                    </div>
                 ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || filteredNews.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-xl shadow-blue-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                isGenerating || filteredNews.length === 0
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>生成报告</span>
                </>
              )}
            </button>

            {generatedImage && (
              <div className="border-t border-slate-100 pt-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-green-600 flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       准备就绪
                    </p>
                    <a href={generatedImage} download={`AutoInsight_Report_${startDate}.png`} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">下载图片</a>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                    <img src={generatedImage} alt="Report Preview" className="w-full rounded shadow-sm opacity-80 hover:opacity-100 transition-opacity cursor-zoom-in" onClick={() => window.open(generatedImage)}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Area */}
        <div className="w-full md:w-2/3 bg-slate-100/50 p-8 overflow-y-auto flex justify-center items-start relative">
           {/* Backdrop Pattern */}
           <div className="absolute inset-0 opacity-[0.03]" 
                style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
           </div>

           {/* POSTER CONTAINER */}
           <div 
             ref={reportRef} 
             className="bg-white w-[375px] min-h-[600px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] flex-shrink-0 flex flex-col relative overflow-hidden"
             style={{ fontFamily: "'Inter', sans-serif" }}
           >
              {/* 1. Header Section */}
              <div className="bg-[#1e293b] text-white p-6 relative overflow-hidden shrink-0">
                 {/* Decorative */}
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                                <span className="text-xs font-bold">A</span>
                            </div>
                            <span className="text-[10px] font-medium tracking-widest text-slate-300 uppercase">Auto Insight</span>
                        </div>
                        <div className="px-2 py-0.5 border border-slate-600 rounded text-[9px] text-slate-400">
                            CONFIDENTIAL
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight leading-none mb-1 text-white">
                       UAE 新闻周报
                    </h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">
                       Market Intelligence Weekly
                    </p>
                    
                    <div className="w-full flex justify-between items-end border-t border-slate-700/50 pt-3">
                        <div className="flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider mb-0.5">日期 (Date)</span>
                            <span className="text-xs font-mono text-slate-300">{startDate} <span className="text-slate-600">/</span> {endDate}</span>
                        </div>
                    </div>
                 </div>
              </div>

              <div className="flex-1 bg-white p-4 flex flex-col gap-4">
                 
                 {/* 2. Visual Overview Section */}
                 {filteredNews.length > 0 && (
                    <div className="grid grid-cols-1 gap-3">
                        {/* Type Chart */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <h3 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                              <span className="w-1 h-3 bg-red-500 rounded-full"></span>
                              新闻类别分布
                           </h3>
                           <div className="flex items-center">
                               <div className="h-24 w-24 relative flex-shrink-0">
                                   <ResponsiveContainer width="100%" height="100%">
                                       <PieChart>
                                           <Pie
                                               data={typeChartData}
                                               cx="50%"
                                               cy="50%"
                                               innerRadius={18}
                                               outerRadius={36}
                                               paddingAngle={2}
                                               dataKey="value"
                                               isAnimationActive={false}
                                               stroke="none"
                                           >
                                               {typeChartData.map((entry, index) => (
                                                   <Cell key={`cell-${index}`} fill={entry.color} />
                                               ))}
                                           </Pie>
                                       </PieChart>
                                   </ResponsiveContainer>
                                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                       <span className="text-[10px] font-bold text-slate-600">{filteredNews.length}</span>
                                   </div>
                               </div>
                               <div className="flex-1 pl-3 grid grid-cols-2 gap-x-2 gap-y-1">
                                   {typeChartData.slice(0, 4).map((item, idx) => (
                                       <div key={idx} className="flex items-center justify-between text-[9px]">
                                           <div className="flex items-center gap-1.5 overflow-hidden">
                                               <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                               <span className="text-slate-600 truncate">{item.name}</span>
                                           </div>
                                           <span className="font-bold text-slate-800">{item.value}</span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                        </div>

                        {/* Brand Chart */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                           <h3 className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mb-2">
                              <span className="w-1 h-3 bg-blue-500 rounded-full"></span>
                              品牌活跃度 TOP 5
                           </h3>
                           <div className="h-20 w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={brandChartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                      <XAxis type="number" hide />
                                      <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        width={50} 
                                        tick={{fontSize: 9, fill: '#64748b'}} 
                                        axisLine={false}
                                        tickLine={false}
                                        interval={0}
                                      />
                                      <Bar dataKey="value" barSize={8} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                                        {brandChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#3b82f6" />
                                        ))}
                                      </Bar>
                                   </BarChart>
                               </ResponsiveContainer>
                           </div>
                        </div>
                    </div>
                 )}

                 {/* 3. News List by Category */}
                 <div className="flex flex-col gap-3">
                    {Object.entries(newsByType).map(([type, items]) => {
                        const typeLabel = NEWS_TYPE_LABELS[type as NewsType];
                        const typeColor = TYPE_COLORS[type] || '#64748b';
                        
                        return (
                            <div key={type} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                                <h4 className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: typeColor }}>
                                    <span className="opacity-80">{type === NewsType.LAUNCH ? '🚀' : type === NewsType.POLICY ? '⚖️' : type === NewsType.SALES ? '📈' : '📰'}</span>
                                    {typeLabel}
                                    <span className="text-slate-300 text-[8px] ml-1">({items!.length})</span>
                                </h4>
                                <div className="space-y-2">
                                    {items!.map((news) => (
                                        <div key={news.id} className="flex gap-2">
                                            <div className="flex-col items-center hidden sm:flex">
                                                <div className="w-1 h-1 bg-slate-300 rounded-full mt-1.5"></div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="px-1 py-px bg-slate-100 text-slate-600 text-[8px] font-bold rounded uppercase">
                                                        {news.brand}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400">{news.date.slice(5)}</span>
                                                </div>
                                                <h5 className="text-[10px] font-bold text-slate-800 leading-snug mb-0.5">
                                                    {news.title}
                                                </h5>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                 </div>

              </div>

              {/* 4. Footer */}
              <div className="bg-slate-50 text-slate-500 p-3 shrink-0 flex justify-between items-center border-t border-slate-100">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-slate-400">GENERATED BY</span>
                    <span className="text-[9px] font-bold text-slate-700 tracking-wider">UAE AUTO INSIGHT</span>
                 </div>
                 <div className="text-right">
                    <span className="text-[8px] text-slate-400 block">SCAN FOR MORE</span>
                    <div className="w-12 h-2 bg-slate-200 rounded mt-0.5 ml-auto"></div>
                 </div>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

export default WeeklyReportModal;
