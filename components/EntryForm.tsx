import React, { useState, useEffect } from 'react';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';
import { analyzeTextWithQwen } from '../services/qwenService';

interface EntryFormProps {
  onAdd: (item: Omit<NewsItem, 'id'>) => void;
  availableBrands: string[];
}

interface PendingItem {
  id: string;
  title: string;
  url: string;
  text: string;
  summary: string;
  source: string;
  scrapedAt: string;
}

interface RssItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

const EntryForm: React.FC<EntryFormProps> = ({ onAdd, availableBrands }) => {
  const [activeTab, setActiveTab] = useState<'spider' | 'ai' | 'manual'>('spider');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Spider / Inbox State ---
  const [spiderUrl, setSpiderUrl] = useState('');
  const [isSpidering, setIsSpidering] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [processingPendingId, setProcessingPendingId] = useState<string | null>(null);

  // --- RSS Radar State ---
  const [rssItems, setRssItems] = useState<RssItem[]>([]);
  const [isScanningRss, setIsScanningRss] = useState(false);
  const [showRss, setShowRss] = useState(false);
  const [rssDays, setRssDays] = useState(3); // Default to last 3 days

  // Load pending items on mount or tab change
  useEffect(() => {
    if (activeTab === 'spider') {
      fetchPendingItems();
    }
  }, [activeTab]);

  const fetchPendingItems = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch(`/api/collect?action=pending&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPendingItems(data);
      }
    } catch (e) {
      console.error("Failed to load pending items", e);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleRssScan = async () => {
    setIsScanningRss(true);
    setError(null);
    setRssItems([]); // Clear previous results while scanning
    try {
      const res = await fetch(`/api/collect?action=rss&days=${rssDays}`);
      if (!res.ok) throw new Error("RSS 扫描失败");
      const data = await res.json();
      setRssItems(data.items || []);
      setShowRss(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsScanningRss(false);
    }
  };

  const handleImportRss = (url: string) => {
    setSpiderUrl(url);
    handleSpiderSubmit(url); // Auto-trigger spider
  };

  const handleSpiderSubmit = async (urlToSpider?: string) => {
    const targetUrl = urlToSpider || spiderUrl;
    if (!targetUrl) return;

    setIsSpidering(true);
    setError(null);
    try {
      const res = await fetch('/api/collect?action=spider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "抓取失败");

      setSpiderUrl('');
      fetchPendingItems(); // Refresh list to show new item

      // If it was from RSS list, maybe remove it from UI? For now keep it.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSpidering(false);
    }
  };

  const handleDeletePending = async (id: string) => {
    // Optimistic UI update
    setPendingItems(prev => prev.filter(i => i.id !== id));
    try {
      await fetch(`/api/collect?action=pending&id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const handleProcessPending = (item: PendingItem) => {
    setAiText(item.text); // Fill AI text area with full body
    setAiImageInput(item.url); // Suggest original URL as image source
    setActiveTab('ai'); // Switch to analysis tab
    setProcessingPendingId(item.id); // Mark this ID to be deleted after success
    setError(null);
  };

  // --- Manual Form State ---
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    brand: availableBrands[0] || '',
    type: NewsType.OTHER,
    date: new Date().toISOString().split('T')[0],
    url: '',
    source: '人工录入',
    image: ''
  });

  useEffect(() => {
    if (availableBrands.length > 0 && !availableBrands.includes(formData.brand)) {
      setFormData(prev => ({ ...prev, brand: availableBrands[0] }));
    }
  }, [availableBrands]);

  // --- AI Form State ---
  const [aiText, setAiText] = useState('');
  const [aiImageInput, setAiImageInput] = useState('');

  const generateImageUrl = (prompt: string) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = formData.image.trim() || generateImageUrl(`${formData.brand} ${formData.title} automotive`);
    onAdd({ ...formData, image: finalImage });
    setFormData(prev => ({ ...prev, title: '', summary: '', url: '', image: '' }));
  };

  const handleAiAnalyze = async () => {
    if (!aiText.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await analyzeTextWithQwen(aiText, availableBrands);

      const finalImage = aiImageInput.trim()
        ? aiImageInput.trim()
        : generateImageUrl(result.image_keywords || `${result.brand} car news`);

      onAdd({
        title: result.title,
        summary: result.summary,
        brand: result.brand,
        type: result.type as NewsType,
        date: result.date,
        url: result.url || aiImageInput,
        source: 'AI 智能提取 (Qwen)',
        image: finalImage
      });

      setAiText('');
      setAiImageInput('');

      // Auto-delete from pending if this came from the spider inbox
      if (processingPendingId) {
        handleDeletePending(processingPendingId);
        setProcessingPendingId(null);
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "分析失败");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('spider')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'spider'
            ? 'bg-white text-blue-700 border-b-4 border-blue-600'
            : 'bg-slate-50 text-slate-500 hover:text-slate-700'
            }`}
        >
          <span>📥</span> 自动采集箱
          {pendingItems.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingItems.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'ai'
            ? 'bg-white text-blue-700 border-b-4 border-blue-600'
            : 'bg-slate-50 text-slate-500 hover:text-slate-700'
            }`}
        >
          🤖 销售情报 AI 提炼
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'manual'
            ? 'bg-white text-blue-700 border-b-4 border-blue-600'
            : 'bg-slate-50 text-slate-500 hover:text-slate-700'
            }`}
        >
          ✍️ 手动录入
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* --- SPIDER TAB (Inbox) --- */}
        {activeTab === 'spider' && (
          <div className="space-y-6">

            {/* 1. RSS Radar Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-lg text-white shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    📡 全网雷达 (RSS Scanner)
                    {isScanningRss && <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">聚合 DriveArabia, GulfNews, YallaMotor 最新资讯</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={rssDays}
                    onChange={(e) => setRssDays(Number(e.target.value))}
                    className="bg-slate-700 text-white text-xs border border-slate-600 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                  >
                    <option value={3}>最近 3 天</option>
                    <option value={5}>最近 5 天</option>
                    <option value={7}>最近 7 天</option>
                    <option value={15}>最近 15 天</option>
                  </select>
                  <button
                    onClick={handleRssScan}
                    disabled={isScanningRss}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isScanningRss ? '扫描中...' : '开始扫描'}
                  </button>
                </div>
              </div>

              {showRss && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar bg-slate-800/50 rounded p-2 border border-slate-700">
                  {rssItems.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-4">
                      在过去 {rssDays} 天内未发现新资讯。<br />建议尝试切换到更大的时间范围。
                    </div>
                  ) : (
                    rssItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-2 p-2 hover:bg-slate-700/50 rounded group transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] bg-slate-600 px-1 rounded text-slate-200">{item.source}</span>
                            <span className="text-[9px] text-slate-400">{item.pubDate}</span>
                          </div>
                          <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-slate-200 truncate block hover:text-blue-400 hover:underline">{item.title}</a>
                        </div>
                        <button
                          onClick={() => handleImportRss(item.link)}
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all"
                          title="抓取并存入采集箱"
                        >
                          ⬇️ 抓取
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 2. Manual Fetch Input */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">或手动粘贴链接</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  className="flex-1 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="https://example.com/news/article..."
                  value={spiderUrl}
                  onChange={(e) => setSpiderUrl(e.target.value)}
                />
                <button
                  onClick={() => handleSpiderSubmit()}
                  disabled={isSpidering || !spiderUrl}
                  className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${isSpidering ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'
                    }`}
                >
                  {isSpidering ? '抓取中...' : '抓取'}
                </button>
              </div>
            </div>

            {/* 3. Pending List (Existing Code) */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex justify-between items-center">
                采集箱 ({pendingItems.length})
                <button onClick={fetchPendingItems} className="text-xs text-blue-500 hover:underline">
                  {isLoadingList ? '加载中...' : '刷新列表'}
                </button>
              </h3>

              {pendingItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  {isLoadingList ? '正在同步数据...' : '采集箱为空，请从上方导入'}
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {pendingItems.map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow group relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-4">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title || '无标题'}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.source}
                            </span>
                            <span className="text-[9px] text-slate-400">{item.scrapedAt}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePending(item.id)}
                          className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                          title="丢弃 (不分析)"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>

                      {/* Summary Preview */}
                      <div className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                        {item.summary || item.text.substring(0, 100) + '...'}
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1.5 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded hover:bg-slate-50"
                        >
                          预览原文
                        </a>
                        <button
                          onClick={() => handleProcessPending(item)}
                          className="flex-[2] py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold rounded shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1"
                        >
                          ⚡️ AI 深度分析
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- AI TAB --- */}
        {activeTab === 'ai' && (
          <div className="space-y-4 animate-fadeIn">
            {processingPendingId && (
              <div className="bg-green-50 text-green-700 px-3 py-2 rounded text-xs border border-green-200 flex justify-between items-center">
                <span>正在处理来自采集箱的文章... (分析成功后将自动移除)</span>
                <button onClick={() => setProcessingPendingId(null)} className="text-green-800 font-bold">✕</button>
              </div>
            )}

            <textarea
              className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none text-slate-700 text-sm font-mono leading-relaxed"
              placeholder="在此粘贴新闻文本..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">图片链接 (可选)</label>
              <input
                type="url"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                placeholder="https://..."
                value={aiImageInput}
                onChange={(e) => setAiImageInput(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] text-slate-400">💡 提示：可直接粘贴微信群聊截图识别出的文字内容，AI会自动过滤闲聊并提取销售情报。</span>
              <button
                onClick={handleAiAnalyze}
                disabled={isProcessing || !aiText.trim()}
                className={`px-6 py-2.5 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${isProcessing || !aiText.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30'
                  }`}
              >
                {isProcessing && <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>}
                {isProcessing ? 'Qwen 分析中...' : '开始提取'}
              </button>
            </div>
          </div>
        )}

        {/* --- MANUAL TAB --- */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">品牌</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                >
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">类型</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as NewsType })}
                >
                  {NEWS_TYPES_LIST.map(t => <option key={t} value={t}>{NEWS_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">标题</label>
              <input
                type="text" required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">日期</label>
                <input
                  type="date" required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">URL</label>
                <input
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">摘要</label>
              <textarea
                required className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700">
                ➕ 确认添加
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EntryForm;
