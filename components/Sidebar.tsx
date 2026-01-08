import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { FilterState, NewsType, NewsItem } from '../types';
import { DEFAULT_BRANDS, NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  allNews: NewsItem[];
  availableBrands: string[];
  onAddBrand: (brand: string) => void;
  onRemoveBrand: (brand: string) => void;
  onOpenBrandAnalysis: (brand: string) => void; // 新增：用于触发品牌分析弹窗
}

const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters, allNews, availableBrands, onAddBrand, onRemoveBrand, onOpenBrandAnalysis }) => {
  const [newBrandInput, setNewBrandInput] = useState("");
  const [isBrandMgmtOpen, setIsBrandMgmtOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'volume' | 'sentiment'>('volume'); // 新增：图表模式状态

  // 1. 声量数据 (原有逻辑)
  const volumeData = useMemo(() => {
    const counts: Record<string, number> = {};
    allNews.forEach(item => {
      counts[item.brand] = (counts[item.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allNews]);

  // 2. 情感数据 (新增逻辑)
  const sentimentData = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    allNews.forEach(item => {
      if (item.sentiment === 'positive') counts.positive++;
      else if (item.sentiment === 'negative') counts.negative++;
      else counts.neutral++;
    });
    return [
        { name: '正面', value: counts.positive, color: '#22c55e' },
        { name: '中性', value: counts.neutral, color: '#94a3b8' },
        { name: '负面', value: counts.negative, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [allNews]);

  const handleBrandChange = (brand: string) => {
    setFilters(prev => {
      const exists = prev.selectedBrands.includes(brand);
      return {
        ...prev,
        selectedBrands: exists
          ? prev.selectedBrands.filter(b => b !== brand)
          : [...prev.selectedBrands, brand]
      };
    });
  };

  const handleTypeChange = (type: NewsType) => {
    setFilters(prev => {
      const exists = prev.selectedTypes.includes(type);
      return {
        ...prev,
        selectedTypes: exists
          ? prev.selectedTypes.filter(t => t !== type)
          : [...prev.selectedTypes, type]
      };
    });
  };

  const handleAddBrandClick = () => {
    if (newBrandInput && !availableBrands.includes(newBrandInput)) {
      onAddBrand(newBrandInput);
      setNewBrandInput("");
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-slate-900 text-slate-100 flex flex-col shadow-xl z-20 overflow-y-auto">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          Auto Insight
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">中东汽车情报中心</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        {/* Trend Chart Area */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              📈 趋势概览
            </h3>
            {/* 新增：图表切换按钮 */}
            <button 
              onClick={() => setChartMode(prev => prev === 'volume' ? 'sentiment' : 'volume')} 
              className="text-[10px] text-red-400 hover:text-white transition-colors"
            >
               切换: {chartMode === 'volume' ? '声量' : '情感'}
            </button>
          </div>
          
          <div className="h-32 w-full bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
            {allNews.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'volume' ? (
                  <BarChart data={volumeData}>
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {volumeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#ef4444" />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                        {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                暂无数据
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            🛠️ 筛选与配置
          </h3>
          
          {/* Search */}
          <div className="space-y-2">
             <label className="text-sm font-medium text-slate-300">全文搜索</label>
             <input
               type="text"
               placeholder="输入关键词..."
               className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-200 placeholder-slate-500"
               value={filters.searchQuery}
               onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
             />
          </div>

          <div className="h-px bg-slate-700 my-4" />

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">时间范围</label>
            <div className="flex flex-col gap-2">
              <input 
                type="date" 
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-200"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
              />
              <input 
                type="date" 
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-200"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
              />
            </div>
          </div>

          <div className="h-px bg-slate-700 my-4" />

          {/* Brands - Modified UI to include Analysis Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">品牌 (🔍 AI 分析)</label>
              <button 
                onClick={() => setIsBrandMgmtOpen(!isBrandMgmtOpen)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                {isBrandMgmtOpen ? "关闭管理" : "管理"}
              </button>
            </div>

            {isBrandMgmtOpen && (
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-2 space-y-3">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                    placeholder="例如: Ford"
                    value={newBrandInput}
                    onChange={(e) => setNewBrandInput(e.target.value)}
                  />
                  <button 
                    onClick={handleAddBrandClick}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                  >
                    添加
                  </button>
                </div>
                <div>
                   <label className="text-[10px] text-slate-500 block mb-1">删除品牌</label>
                   <select 
                     className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                     onChange={(e) => {
                       if (e.target.value) {
                         if (confirm(`确定删除 ${e.target.value} 吗？`)) {
                           onRemoveBrand(e.target.value);
                         }
                         e.target.value = "";
                       }
                     }}
                   >
                     <option value="">选择要删除的品牌...</option>
                     {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {availableBrands.map(brand => {
                const isSelected = filters.selectedBrands.includes(brand);
                return (
                  <div key={brand} className={`inline-flex items-center rounded border transition-colors ${
                      isSelected
                        ? 'bg-red-500/10 border-red-500'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}>
                      {/* Filter Button */}
                      <button
                        onClick={() => handleBrandChange(brand)}
                        className={`px-2 py-1 text-xs rounded-l ${
                          isSelected ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        {brand}
                      </button>
                      
                      {/* Divider */}
                      <div className={`w-px h-3 ${isSelected ? 'bg-red-500/30' : 'bg-slate-600'}`}></div>

                      {/* Analysis Button */}
                      <button
                        onClick={(e) => {
                           e.stopPropagation();
                           onOpenBrandAnalysis(brand);
                        }}
                        className={`px-1.5 py-1 text-[10px] hover:bg-slate-700/50 rounded-r ${
                             isSelected ? 'text-red-400' : 'text-slate-500 hover:text-white'
                        }`}
                        title={`AI 分析: ${brand}`}
                      >
                        🔍
                      </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-700 my-4" />

          {/* Types */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">类型</label>
            <div className="flex flex-col gap-1.5">
              {NEWS_TYPES_LIST.map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    filters.selectedTypes.includes(type) ? 'bg-red-500 border-red-500' : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {filters.selectedTypes.includes(type) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={filters.selectedTypes.includes(type)}
                    onChange={() => handleTypeChange(type)}
                  />
                  <span className={filters.selectedTypes.includes(type) ? 'text-slate-200' : 'text-slate-400 group-hover:text-slate-300'}>
                    {NEWS_TYPE_LABELS[type]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-700 text-center text-xs text-slate-500">
        © 2025 Auto Insight
      </div>
    </aside>
  );
};

export default Sidebar;
