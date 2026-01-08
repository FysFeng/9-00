import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import EntryForm from './components/EntryForm';
import WeeklyReportModal from './components/WeeklyReportModal';
import BrandAnalysisModal from './components/BrandAnalysisModal';
import Inbox from './components/Inbox'; 
import { NEWS_TYPES_LIST, INITIAL_NEWS, DEFAULT_BRANDS, NEWS_TYPE_LABELS } from './constants';
import { NewsItem, FilterState, PendingItem } from './types';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [analyzingBrand, setAnalyzingBrand] = useState<string | null>(null);

  // Data States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0); 

  // Inbox -> Entry Transfer State
  const [inboxItemToAnalyze, setInboxItemToAnalyze] = useState<PendingItem | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const newsRes = await fetch(`/api/news?_t=${Date.now()}`, { cache: 'no-store' });
        if (!newsRes.ok) throw new Error("Connection failed");
        const newsData = await newsRes.json();
        setNews(newsData.length > 0 ? newsData : INITIAL_NEWS);

        const brandsRes = await fetch(`/api/brands?_t=${Date.now()}`, { cache: 'no-store' });
        const brandsData = await brandsRes.json();
        setCustomBrands(brandsData.length > 0 ? brandsData : DEFAULT_BRANDS);

        // 加载 Inbox 数量 (忽略 404，防止阻塞 UI)
        try {
            const pendingRes = await fetch(`/api/pending?_t=${Date.now()}`);
            if (pendingRes.ok) {
                const d = await pendingRes.json();
                setPendingCount(d.length);
            }
        } catch (e) { console.log("Pending API not ready yet"); }

      } catch (error) {
        console.error("Cloud data error:", error);
        setNews(INITIAL_NEWS);
        setCustomBrands(DEFAULT_BRANDS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const [filters, setFilters] = useState<FilterState>({
    startDate: '', 
    endDate: new Date().toISOString().split('T')[0],
    selectedBrands: DEFAULT_BRANDS, 
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: ''
  });

  useEffect(() => {
      if (filters.selectedBrands.length === DEFAULT_BRANDS.length && customBrands.length !== DEFAULT_BRANDS.length) {
          setFilters(prev => ({ ...prev, selectedBrands: customBrands }));
      }
  }, [customBrands]);

  const [activeTab, setActiveTab] = useState<'feed' | 'entry' | 'inbox'>('feed');

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const startMatch = !filters.startDate || item.date >= filters.startDate;
      const endMatch = !filters.endDate || item.date <= filters.endDate;
      const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(item.brand);
      const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
      const searchLower = filters.searchQuery.toLowerCase();
      const searchMatch = !filters.searchQuery || 
                          item.title.toLowerCase().includes(searchLower) || 
                          item.summary.toLowerCase().includes(searchLower) ||
                          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchLower)));

      return startMatch && endMatch && brandMatch && typeMatch && searchMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  }, [news, filters]);

  const saveNewsToCloud = async (updatedNews: NewsItem[]) => {
    setIsSaving(true);
    try {
      await fetch('/api/news', { method: 'POST', body: JSON.stringify(updatedNews) });
    } catch (e) { console.error("Save failed", e); } 
    finally { setIsSaving(false); }
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
        const newBrands = [...customBrands, itemData.brand];
        setCustomBrands(newBrands);
        await fetch('/api/brands', { method: 'POST', body: JSON.stringify(newBrands) });
        setFilters(p => ({ ...p, selectedBrands: [...p.selectedBrands, itemData.brand] }));
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (confirm('Delete this item?')) {
      const newNewsList = news.filter(item => item.id !== id);
      setNews(newNewsList);
      await saveNewsToCloud(newNewsList);
    }
  };

  const handleAnalyzeFromInbox = (item: PendingItem) => {
    setInboxItemToAnalyze(item);
    setActiveTab('entry');
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center text-slate-500 font-sans">Loading Auto Insight...</div>;

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-900 bg-slate-50">
      <Sidebar 
        filters={filters} 
        setFilters={setFilters} 
        allNews={news}
        availableBrands={customBrands}
        onAddBrand={(b) => {
            const nb = [...customBrands, b]; 
            setCustomBrands(nb); 
            fetch('/api/brands', { method: 'POST', body: JSON.stringify(nb) });
        }}
        onRemoveBrand={(b) => {
            const nb = customBrands.filter(x => x !== b);
            setCustomBrands(nb);
            fetch('/api/brands', { method: 'POST', body: JSON.stringify(nb) });
        }}
        onOpenBrandAnalysis={(b) => setAnalyzingBrand(b)}
      />
      
      <main className="flex-1 ml-72 h-full overflow-y-auto relative">
        <div className="max-w-5xl mx-auto p-8 pb-32">
          
          <div className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${isSaving ? 'bg-yellow-400' : 'bg-green-500'}`}></span>
                <span className="text-sm font-medium text-slate-500">
                  {news.length} Records • {customBrands.length} Brands
                </span>
             </div>
             <button onClick={() => setIsReportModalOpen(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm hover:border-red-500 hover:text-red-500 transition-all">
                Weekly Report
             </button>
          </div>

          <div className="mb-6 flex space-x-8 border-b border-slate-200">
              <button onClick={() => setActiveTab('feed')} className={`pb-4 text-sm font-bold transition-colors ${activeTab === 'feed' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400 hover:text-slate-600'}`}>Live Feed</button>
              
              <button onClick={() => setActiveTab('inbox')} className={`pb-4 text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'inbox' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  Inbox (爬虫)
                  {pendingCount > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
              </button>

              <button onClick={() => setActiveTab('entry')} className={`pb-4 text-sm font-bold transition-colors ${activeTab === 'entry' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-400 hover:text-slate-600'}`}>Intelligence Entry</button>
          </div>

          <div className="min-h-[500px]">
            {activeTab === 'feed' && (
              <div className="space-y-4">
                {filteredNews.length > 0 ? (
                  filteredNews.map(item => <NewsCard key={item.id} item={item} onDelete={handleDeleteNews} />)
                ) : (
                  <div className="text-center py-20 opacity-50">No intelligence found matching filters.</div>
                )}
              </div>
            )}

            {activeTab === 'inbox' && (
                <Inbox 
                    onAnalyze={handleAnalyzeFromInbox} 
                    pendingCount={pendingCount}
                    setPendingCount={setPendingCount}
                />
            )}

            {activeTab === 'entry' && (
              <EntryForm 
                onAdd={handleAddNews} 
                availableBrands={customBrands} 
                initialData={inboxItemToAnalyze}
                onClearInitialData={() => setInboxItemToAnalyze(null)}
              />
            )}
          </div>
        </div>
      </main>

      <WeeklyReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        allNews={news} 
      />

      {analyzingBrand && (
        <BrandAnalysisModal 
            isOpen={!!analyzingBrand}
            onClose={() => setAnalyzingBrand(null)}
            brand={analyzingBrand}
            allNews={news}
        />
      )}
    </div>
  );
}

export default App;
