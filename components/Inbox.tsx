import React, { useState, useEffect } from 'react';
import { PendingItem } from '../types';

interface InboxProps {
  onAnalyze: (item: PendingItem) => void;
  pendingCount: number;
  setPendingCount: (n: number) => void;
}

const Inbox: React.FC<InboxProps> = ({ onAnalyze, setPendingCount }) => {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPending = async () => {
    try {
      const res = await fetch('/api/pending?_t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setPendingCount(data.length);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { loadPending(); }, []);

  const handleRefreshRSS = async () => {
    setIsRefreshing(true);
    try {
      const rssRes = await fetch('/api/rss');
      if (!rssRes.ok) throw new Error("RSS Fetch Failed");
      const rssData: PendingItem[] = await rssRes.json();

      // Client-side dedup logic
      const existingLinks = new Set(items.map(i => i.link));
      const newItems = rssData.filter(i => !existingLinks.has(i.link));

      if (newItems.length > 0) {
        const updatedList = [...newItems, ...items];
        setItems(updatedList);
        setPendingCount(updatedList.length);
        await fetch('/api/pending', { method: 'POST', body: JSON.stringify(updatedList) });
        alert(`Found ${newItems.length} new automotive articles.`);
      } else {
        alert("No new updates found.");
      }
    } catch (e) {
      alert("Refresh failed. Check console.");
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    const newList = items.filter(i => i.id !== id);
    setItems(newList);
    setPendingCount(newList.length);
    fetch('/api/pending', { method: 'POST', body: JSON.stringify(newList) });
  };

  if (isLoading) return <div className="p-10 text-center text-slate-400">Loading Inbox...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
       <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                📥 待处理情报 (Inbox)
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Automotive Only</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">自动聚合 {items.length} 条未读新闻。仅抓取文本与链接，不消耗 Token。</p>
          </div>
          <button 
            onClick={handleRefreshRSS}
            disabled={isRefreshing}
            className={`px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-400 hover:text-red-500'}`}
          >
            {isRefreshing ? <span className="animate-spin">↻</span> : '📡'}
            <span>{isRefreshing ? '正在连接 RSS...' : '立即同步信源'}</span>
          </button>
       </div>

       {items.length === 0 ? (
         <div className="text-center py-24 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400 mb-4">当前没有待处理的情报。</p>
            <button onClick={handleRefreshRSS} className="text-red-600 font-bold hover:underline text-sm">检查更新</button>
         </div>
       ) : (
         <div className="space-y-4">
            {items.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex gap-5 group">
                    {/* Image Preview (URL only) */}
                    <div className="w-24 h-24 shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 relative">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt="preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <span className="text-2xl">📰</span>
                                <span className="text-[10px] mt-1">Text Only</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                {item.sourceName}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                                {new Date(item.pubDate).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2 truncate group-hover:text-red-600 transition-colors" title={item.title}>{item.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.snippet}</p>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-flex items-center gap-1">
                            阅读原文 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                    </div>
                    
                    <div className="flex flex-col justify-center gap-2 border-l border-slate-100 pl-5">
                        <button 
                            onClick={() => {
                                onAnalyze(item); 
                                handleDismiss(item.id);
                            }}
                            className="w-24 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow-sm hover:shadow-red-200 transition-all flex items-center justify-center gap-1"
                        >
                            <span>⚡ 处理</span>
                        </button>
                        <button 
                            onClick={() => handleDismiss(item.id)}
                            className="w-24 py-2 bg-white border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            忽略
                        </button>
                    </div>
                </div>
            ))}
         </div>
       )}
    </div>
  );
};

export default Inbox;
}
