{
type: uploaded file
fileName: components/Inbox.tsx
fullContent:
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

  // 加载待处理列表
  const loadPending = async () => {
    try {
      const res = await fetch('/api/pending?_t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setPendingCount(data.length);
      }
    } catch (e) {
      console.error("Failed to load inbox", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  // 触发 RSS 抓取并合并到 Pending 列表
  const handleRefreshRSS = async () => {
    setIsRefreshing(true);
    try {
      // 1. 抓取 RSS
      const rssRes = await fetch('/api/rss');
      const rssData: PendingItem[] = await rssRes.json();

      // 2. 简单的客户端去重 (对比 link)
      const existingLinks = new Set(items.map(i => i.link));
      const newItems = rssData.filter(i => !existingLinks.has(i.link));

      if (newItems.length === 0) {
        alert("暂无新情报");
      } else {
        // 3. 合并并保存到云端 pending.json
        const updatedList = [...newItems, ...items];
        setItems(updatedList);
        setPendingCount(updatedList.length);
        await fetch('/api/pending', {
             method: 'POST', 
             body: JSON.stringify(updatedList) 
        });
        alert(`成功抓取 ${newItems.length} 条新情报`);
      }
    } catch (e) {
      console.error(e);
      alert("抓取失败，请检查网络或 API");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = async (id: string) => {
    const newList = items.filter(i => i.id !== id);
    setItems(newList);
    setPendingCount(newList.length);
    // 异步同步到云端，不阻塞 UI
    fetch('/api/pending', { method: 'POST', body: JSON.stringify(newList) });
  };

  if (isLoading) return <div className="p-8 text-slate-400 text-center">Loading Inbox...</div>;

  return (
    <div className="max-w-4xl mx-auto">
       <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">📥 情报待处理箱 (Inbox)</h2>
            <p className="text-slate-500 text-sm mt-1">来自 RSS 订阅源的自动抓取数据，需人工确认后入库。</p>
          </div>
          <button 
            onClick={handleRefreshRSS}
            disabled={isRefreshing}
            className={`px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 ${isRefreshing ? 'opacity-50' : ''}`}
          >
            {isRefreshing ? <span className="animate-spin">↻</span> : '📡'}
            <span>{isRefreshing ? '抓取中...' : '抓取 RSS 更新'}</span>
          </button>
       </div>

       {items.length === 0 ? (
         <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">待处理箱是空的。</p>
            <button onClick={handleRefreshRSS} className="mt-4 text-red-600 font-bold hover:underline">立即运行抓取任务</button>
         </div>
       ) : (
         <div className="space-y-4">
            {items.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                                {item.sourceName}
                            </span>
                            <span className="text-xs text-slate-400">
                                {new Date(item.pubDate).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2">{item.snippet}</p>
                        <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-2 inline-block">🔗 阅读原文</a>
                    </div>
                    
                    <div className="flex flex-col justify-center gap-2 border-l border-slate-100 pl-4 min-w-[120px]">
                        <button 
                            onClick={() => {
                                onAnalyze(item); // 触发父组件逻辑，跳转到 EntryForm
                                handleDismiss(item.id); // 移出待处理列表
                            }}
                            className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                        >
                            <span>⚡ AI 分析</span>
                        </button>
                        <button 
                            onClick={() => handleDismiss(item.id)}
                            className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded hover:bg-slate-200 transition-colors"
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
