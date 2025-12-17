import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import EntryForm from './components/EntryForm';
import { NEWS_TYPES_LIST, INITIAL_NEWS, DEFAULT_BRANDS, NEWS_TYPE_LABELS } from './constants';
import { NewsItem, FilterState } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Data States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);

  // Load data from Cloud API on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch News - Force bypass browser cache with timestamp and headers
        const newsRes = await fetch(`/api/news?_t=${Date.now()}`, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        
        if (!newsRes.ok) throw new Error("无法连接云端数据库");
        const newsData = await newsRes.json();
        setNews(newsData.length > 0 ? newsData : INITIAL_NEWS);

        // Fetch Brands - Force bypass cache
        const brandsRes = await fetch(`/api/brands?_t=${Date.now()}`, { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        const brandsData = await brandsRes.json();
        setCustomBrands(brandsData.length > 0 ? brandsData : DEFAULT_BRANDS);

      } catch (error) {
        console.error("Failed to load cloud data:", error);
        setDbError("无法连接 Vercel Blob 云存储，更改可能不会保存。请检查 BLOB_READ_WRITE_TOKEN 配置。");
        setNews(INITIAL_NEWS);
        setCustomBrands(DEFAULT_BRANDS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Default Filter State
  const defaultEndDate = new Date().toISOString().split('T')[0];
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: '', 
    endDate: defaultEndDate,
    selectedBrands: DEFAULT_BRANDS, 
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: ''
  });

  // Sync selectedBrands
  useEffect(() => {
      if (filters.selectedBrands.length === DEFAULT_BRANDS.length && customBrands.length !== DEFAULT_BRANDS.length) {
          setFilters(prev => ({ ...prev, selectedBrands: customBrands }));
      }
      setFilters(prev => ({
        ...prev,
        selectedBrands: prev.selectedBrands.filter(b => customBrands.includes(b))
      }));
  }, [customBrands]);

  const [activeTab, setActiveTab] = useState<'feed' | 'entry'>('feed');

  // Filter & Sort Logic
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const startMatch = !filters.startDate || item.date >= filters.startDate;
      const endMatch = !filters.endDate || item.date <= filters.endDate;
      
      const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(item.brand);
      const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
      
      const searchLower = filters.searchQuery.toLowerCase();
      const searchMatch = !filters.searchQuery || 
                          item.title.toLowerCase().includes(searchLower) || 
                          item.summary.toLowerCase().includes(searchLower);

      return startMatch && endMatch && brandMatch && typeMatch && searchMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  }, [news, filters]);

  // Cloud Actions
  const saveNewsToCloud = async (updatedNews: NewsItem[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNews)
      });
      if (!res.ok) throw new Error("Save failed");
    } catch (e) {
      console.error("Cloud save failed", e);
      alert("云端保存失败，请检查网络");
    } finally {
      setIsSaving(false);
    }
  };

  const saveBrandsToCloud = async (updatedBrands: string[]) => {
    try {
      await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBrands)
      });
    } catch (e) {
      console.error("Cloud save failed", e);
    }
  };

  const handleAddNews = async (itemData: Omit<NewsItem, 'id'>) => {
    const newId = Math.random().toString(36).substring(2, 9);
    
    const newItem: NewsItem = {
      ...itemData,
      id: newId,
      image: itemData.image || `https://image.pollinations.ai/prompt/${encodeURIComponent(itemData.brand + ' car')}?nologo=true`
    };
    
    const newNewsList = [newItem, ...news];
    setNews(newNewsList);
    setActiveTab('feed');
    
    await saveNewsToCloud(newNewsList);

    if (!customBrands.includes(itemData.brand)) {
        const newBrandList = [...customBrands, itemData.brand];
        setCustomBrands(newBrandList);
        saveBrandsToCloud(newBrandList);
        
        setFilters(prev => ({
            ...prev,
            selectedBrands: [...prev.selectedBrands, itemData.brand]
        }));
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (confirm('确定要删除这条吗？(此操作将同步给所有团队成员)')) {
      const newNewsList = news.filter(item => item.id !== id);
      setNews(newNewsList);
      await saveNewsToCloud(newNewsList);
    }
  };

  const handleAddBrand = async (brand: string) => {
    if (!customBrands.includes(brand)) {
      const newBrandList = [...customBrands, brand];
      setCustomBrands(newBrandList);
      setFilters(prev => ({ ...prev, selectedBrands: [...prev.selectedBrands, brand] }));
      await saveBrandsToCloud(newBrandList);
    }
  };

  const handleRemoveBrand = async (brand: string) => {
    const newBrandList = customBrands.filter(b => b !== brand);
    setCustomBrands(newBrandList);
    setFilters(prev => ({
      ...prev,
      selectedBrands: prev.selectedBrands.filter(b => b !== brand)
    }));
    await saveBrandsToCloud(newBrandList);
  };

  const handleExportCSV = () => {
    if (filteredNews.length === 0) {
      alert("当前没有可导出的数据");
      return;
    }

    // 1. 序号, 2. 公司名, 3. 时间, 4. 新闻类别, 5. 新闻内容
    const headers = ["序号", "公司名", "时间", "新闻类别", "新闻内容"];
    const rows = filteredNews.map((item, index) => {
      // Escape CSV special characters (quotes)
      const escape = (text: string) => {
        if (!text) return '""';
        return `"${text.replace(/"/g, '""')}"`;
      };
      
      const content = `${item.title}\n${item.summary}`;

      return [
        index + 1,
        escape(item.brand),
        escape(item.date),
        escape(NEWS_TYPE_LABELS[item.type] || item.type),
        escape(content)
      ].join(",");
    });

    // Add BOM for Chinese character support in Excel
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AutoInsight_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    if (news.length === 0) return { count: 0, topBrand: 'N/A', latest: 'N/A', sources: 0 };
    
    const brandCounts: Record<string, number> = {};
    const sources = new Set<string>();
    let latestDate = '';

    news.forEach(item => {
        brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
        sources.add(item.source);
        if (!latestDate || item.date > latestDate) latestDate = item.date;
    });

    const topBrand = Object.entries(brandCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
        count: news.length,
        topBrand,
        latest: latestDate,
        sources: sources.size
    };
  }, [news]);

  if (isLoading) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="text-slate-500 font-medium">正在连接 Vercel Blob 云端数据...</p>
          </div>
      );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        filters={filters} 
        setFilters={setFilters} 
        allNews={news}
        availableBrands={customBrands}
        onAddBrand={handleAddBrand}
        onRemoveBrand={handleRemoveBrand}
      />
      
      <main className="flex-1 ml-72 h-full overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-8">
          
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isSaving ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'} shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></div>
                <span className="text-sm font-medium text-slate-600">
                  {isSaving ? "正在同步到云端..." : "Vercel Blob 已连接 (团队同步)"}
                </span>
             </div>
             {dbError && (
                 <div className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded border border-red-100">
                     ⚠️ {dbError}
                 </div>
             )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">当前新闻数</p>
              <p className="text-2xl font-bold text-slate-800">{stats.count} 条</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">活跃品牌</p>
              <p className="text-2xl font-bold text-slate-800 truncate">{stats.topBrand}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">最新新闻</p>
              <p className="text-2xl font-bold text-slate-800 text-sm md:text-xl">{stats.latest}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-xs text-slate-400 uppercase font-semibold">来源覆盖</p>
              <p className="text-2xl font-bold text-slate-800">{stats.sources}</p>
            </div>
          </div>

          <div className="mb-6 border-b border-slate-200 flex justify-between items-end">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('feed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'feed'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📅 新闻时间线 (Feed)
              </button>
              <button
                onClick={() => setActiveTab('entry')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'entry'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                📝 录入与分析 (Add News)
              </button>
            </nav>

            <button
               onClick={handleExportCSV}
               className="mb-3 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-2 shadow-sm"
               title="导出当前筛选结果"
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               导出 新闻
            </button>
          </div>

          <div className="min-h-[500px]">
            {activeTab === 'feed' ? (
              <div className="space-y-2">
                {filteredNews.length > 0 ? (
                  filteredNews.map(item => (
                    <NewsCard key={item.id} item={item} onDelete={handleDeleteNews} />
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-400 text-lg">📭 当前筛选范围内没有数据。</p>
                    <button 
                        onClick={() => setFilters({
                            startDate: '',
                            endDate: defaultEndDate,
                            selectedBrands: customBrands,
                            selectedTypes: NEWS_TYPES_LIST,
                            searchQuery: ''
                        })}
                        className="mt-4 text-red-500 font-medium hover:underline"
                    >
                        重置并显示所有历史
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <EntryForm onAdd={handleAddNews} availableBrands={customBrands} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
