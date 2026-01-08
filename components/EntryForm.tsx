import React, { useState, useEffect } from 'react';
import { NewsItem, NewsType, PendingItem } from '../types';
import { NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';
import { analyzeTextWithQwen } from '../services/qwenService';

interface EntryFormProps {
  onAdd: (item: Omit<NewsItem, 'id'>) => void;
  availableBrands: string[];
  initialData?: PendingItem | null; // [Feature A] 接收 RSS 数据
  onClearInitialData?: () => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onAdd, availableBrands, initialData, onClearInitialData }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Form State
  const [aiText, setAiText] = useState('');
  const [aiImageInput, setAiImageInput] = useState('');

  // Manual Form State
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

  // [Feature A Logic] 监听 initialData 变化，自动填充
  useEffect(() => {
    if (initialData) {
        setActiveTab('ai');
        // 1. 拼装 Prompt 上下文给 AI
        const combinedText = `Title: ${initialData.title}\nSource: ${initialData.sourceName}\nDate: ${initialData.pubDate}\nLink: ${initialData.link}\nContent Snippet: ${initialData.snippet}`;
        setAiText(combinedText);
        
        // 2. [关键需求] 将流转过来的图片链接填入输入框
        if (initialData.imageUrl) {
            setAiImageInput(initialData.imageUrl);
        } else {
            setAiImageInput(''); // 留空，让 AI 生成或用户手动补
        }
    }
  }, [initialData]);

  // 确保 Manual Form 的 Brand 是有效的
  useEffect(() => {
    if (availableBrands.length > 0 && !availableBrands.includes(formData.brand)) {
        setFormData(prev => ({ ...prev, brand: availableBrands[0] }));
    }
  }, [availableBrands]);

  const generateImageUrl = (prompt: string) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 手动录入时，如果没填图，就生成一张
    const finalImage = formData.image.trim() || generateImageUrl(`${formData.brand} ${formData.title} automotive`);
    
    onAdd({ 
        ...formData, 
        image: finalImage 
    });

    // 重置表单
    setFormData(prev => ({ ...prev, title: '', summary: '', url: '', image: '' }));
    if (onClearInitialData) onClearInitialData();
  };

  const handleAiAnalyze = async () => {
    if (!aiText.trim()) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      // 调用 Qwen 分析
      const result = await analyzeTextWithQwen(aiText, availableBrands);
      
      // 图片逻辑：
      // 1. 优先使用输入框里的 (可能是 RSS 带过来的，也可能是用户粘贴的)
      // 2. 如果都没有，使用 AI 生成的关键词画一张图
      const finalImage = aiImageInput.trim() 
        ? aiImageInput.trim() 
        : generateImageUrl(result.image_keywords || `${result.brand} car news`);
      
      onAdd({
        title: result.title,
        summary: result.summary,
        brand: result.brand,
        type: result.type as NewsType,
        date: result.date,
        // 链接逻辑：优先用 RSS 的原始链接，没有则用 AI 提取的
        url: initialData?.link || result.url, 
        source: initialData ? `${initialData.sourceName}` : 'AI 智能提取',
        image: finalImage
      });
      
      // 清空状态
      setAiText(''); 
      setAiImageInput('');
      if (onClearInitialData) onClearInitialData();
      
    } catch (err: any) {
      console.error("Analysis Error:", err);
      const msg = err.message || "未知错误";
      if (msg.includes("JSON")) {
          setError("AI 返回数据格式异常，请重试");
      } else {
          setError("分析失败: " + msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'ai' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          🤖 AI 智能识别 {initialData && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">RSS 关联中</span>}
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'manual' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          ✍️ 手动录入
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'ai' ? (
          <div className="space-y-4">
            {/* 1. RSS 关联预览卡片 */}
            {initialData && (
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 animate-fadeIn">
                    {initialData.imageUrl ? (
                        <div className="w-16 h-16 shrink-0 rounded bg-slate-200 overflow-hidden border border-slate-300 group relative">
                            <img src={initialData.imageUrl} alt="RSS Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                    ) : (
                        <div className="w-16 h-16 shrink-0 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400 border border-slate-200">
                            No Img
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-700 line-clamp-1" title={initialData.title}>{initialData.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500">{initialData.sourceName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{initialData.pubDate.split('T')[0]}</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClearInitialData} 
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="取消关联"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}
            
            {/* 2. 文本输入区域 */}
            <div className="relative">
                <textarea
                className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-slate-700 text-sm font-mono leading-relaxed"
                placeholder="在此粘贴新闻文本..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-300 pointer-events-none">
                    Qwen-Plus Model
                </div>
            </div>

            {/* 3. 图片链接输入框 (自动填充) */}
            <div>
               <div className="flex justify-between items-center mb-1">
                   <label className="block text-xs font-medium text-slate-500 uppercase">图片链接 (Image URL)</label>
                   {initialData?.imageUrl && (
                       <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           已自动提取
                       </span>
                   )}
               </div>
               <input 
                  type="url"
                  className={`w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 font-mono text-slate-600 transition-colors ${
                      initialData?.imageUrl && aiImageInput === initialData.imageUrl 
                      ? 'bg-green-50/30 border-green-200' 
                      : 'border-slate-300'
                  }`}
                  placeholder="https://..."
                  value={aiImageInput}
                  onChange={(e) => setAiImageInput(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-1">
                  系统只存储链接引用，不下载图片文件。若留空，AI 将根据内容生成示意图。
              </p>
            </div>
            
            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm flex items-center gap-2 animate-pulse">
                 <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <span>{error}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleAiAnalyze}
                disabled={isProcessing || !aiText.trim()}
                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm flex items-center gap-2 ${
                  isProcessing || !aiText.trim()
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>AI 分析中...</span>
                  </>
                ) : (
                  <>
                    <span>{initialData ? '确认入库' : '开始分析'}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 完整的 Manual Form 代码 */
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">品牌</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                >
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">类型</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as NewsType})}
                >
                  {NEWS_TYPES_LIST.map(t => <option key={t} value={t}>{NEWS_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">日期</label>
                <input 
                  type="date"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">原文 URL (可选)</label>
                <input 
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">标题</label>
              <input 
                type="text"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 font-bold text-slate-700"
                placeholder="输入新闻标题..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">摘要</label>
                    <textarea 
                        required
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                        placeholder="简要概括..."
                        value={formData.summary}
                        onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-500 uppercase mb-1">配图链接 (可选)</label>
                     <textarea 
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-red-500 font-mono"
                        placeholder="https://... (留空自动生成)"
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <span>确认添加</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EntryForm;
