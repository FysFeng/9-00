import React, { useState, useMemo } from 'react';
import { useIntelligenceStore } from '../src/store/useIntelligenceStore';
import { NewsType, NewsItem } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

// ─── Stage Definitions ───────────────────────────────────────────────────────
// Journey stages in chronological market-entry order
const STAGES: { type: NewsType; label: string; icon: string; color: string; bg: string; border: string }[] = [
    {
        type: NewsType.CORP_STRATEGY,
        label: '战略进入',
        icon: '🏢',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
    },
    {
        type: NewsType.LAUNCH_PHYSICAL,
        label: '新车发布',
        icon: '🚘',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
    },
    {
        type: NewsType.TECH_OTA,
        label: '技术/配置',
        icon: '⚡',
        color: 'text-cyan-700',
        bg: 'bg-cyan-50',
        border: 'border-cyan-300',
    },
    {
        type: NewsType.NETWORK_SERVICE,
        label: '渠道铺开',
        icon: '🗂️',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-300',
    },
    {
        type: NewsType.COMPETITOR_TACTICS,
        label: '价格/促销',
        icon: '🏷️',
        color: 'text-fuchsia-700',
        bg: 'bg-fuchsia-50',
        border: 'border-fuchsia-300',
    },
    {
        type: NewsType.MARKET_SALES,
        label: '销量数据',
        icon: '📊',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
    },
    {
        type: NewsType.POLICY,
        label: '政策监管',
        icon: '🏛️',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
    },
    {
        type: NewsType.OTHER,
        label: '其他',
        icon: '📎',
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
    },
];

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.type, s]));

// ─── News Card in timeline ────────────────────────────────────────────────────
function TimelineCard({ item }: { item: NewsItem }) {
    const [expanded, setExpanded] = useState(false);
    const stage = STAGE_MAP[item.type] || STAGES[STAGES.length - 1];

    return (
        <div className={`ml-4 pl-4 border-l-2 ${stage.border} pb-5 last:pb-0 group relative`}>
            {/* dot */}
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${stage.bg} ring-2 ${stage.border.replace('border-', 'ring-')}`}></div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${stage.bg} ${stage.color} ${stage.border}`}>
                        {item.brand.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                    {item.source && (
                        <span className="text-[10px] text-slate-400 ml-auto">来源: {item.source}</span>
                    )}
                </div>

                <h4 className="text-sm font-bold text-slate-800 mb-1.5 leading-snug">
                    {item.title}
                </h4>

                <p className={`text-xs text-slate-500 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
                    {item.summary}
                </p>

                <div className="flex items-center gap-3 mt-2.5">
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap flex-1">
                            {item.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">#{tag}</span>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-[10px] text-slate-400 hover:text-blue-600 font-medium shrink-0 transition-colors"
                    >
                        {expanded ? '收起 ↑' : '展开 ↓'}
                    </button>
                    {item.url && item.url !== '#' && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-blue-500 hover:text-blue-700 font-medium shrink-0">
                            原文 →
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ModelTimeline() {
    const { rawIntelligence } = useIntelligenceStore();
    const [query, setQuery] = useState('');
    const [submitted, setSubmitted] = useState('');

    const handleSearch = () => {
        const q = query.trim();
        if (q.length < 1) return;
        setSubmitted(q);
    };

    // Match against title + summary, case-insensitive
    const matchedNews = useMemo(() => {
        if (!submitted) return [];
        const lower = submitted.toLowerCase();
        return rawIntelligence.filter(item =>
            item.title.toLowerCase().includes(lower) ||
            (item.summary || '').toLowerCase().includes(lower)
        ).sort((a, b) => a.date.localeCompare(b.date)); // chronological
    }, [submitted, rawIntelligence]);

    // Group by stage type
    const grouped = useMemo(() => {
        const map: Record<string, NewsItem[]> = {};
        matchedNews.forEach(item => {
            if (!map[item.type]) map[item.type] = [];
            map[item.type].push(item);
        });
        return map;
    }, [matchedNews]);

    // Compute earliest and latest date
    const dateRange = useMemo(() => {
        if (matchedNews.length === 0) return null;
        const dates = matchedNews.map(n => n.date).sort();
        return { from: dates[0], to: dates[dates.length - 1] };
    }, [matchedNews]);

    return (
        <div className="p-6 lg:p-10 w-full animate-fadeIn overflow-y-auto h-full">

            {/* Header */}
            <div className="mb-8 pb-4 border-b border-slate-200/60">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
                    车型生命周期
                    <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-md font-bold tracking-wide border border-slate-200">
                        Model Journey
                    </span>
                </h1>
                <p className="text-[11px] text-slate-500 font-bold mt-2 tracking-[0.15em] uppercase">
                    从入驻 UAE 到热销 — 全过程追踪
                </p>
            </div>

            {/* Search */}
            <div className="max-w-2xl mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    输入车型关键词
                </label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="例如: Atto 3 · CS75 · Land Cruiser · Atto · 宝马"
                        className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
                    />
                    <button
                        onClick={handleSearch}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95"
                    >
                        追踪
                    </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                    在全部资讯的标题和摘要中搜索，按事件类型分阶段整理为时间轴
                </p>
            </div>

            {/* Results: empty state */}
            {!submitted && (
                <div className="max-w-2xl mx-auto mt-20 text-center">
                    <div className="text-5xl mb-4">🚗</div>
                    <p className="text-slate-400 font-medium">输入车型名称后点击「追踪」</p>
                    <p className="text-slate-300 text-sm mt-1">将呈现该车型在 UAE 市场的完整情报轨迹</p>
                </div>
            )}

            {/* No results */}
            {submitted && matchedNews.length === 0 && (
                <div className="max-w-2xl mt-10 p-8 bg-white rounded-2xl border border-slate-100 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-slate-500 font-bold">未找到「{submitted}」相关资讯</p>
                    <p className="text-slate-400 text-sm mt-1">请尝试更短的关键词，或先采集更多资讯</p>
                </div>
            )}

            {/* Results: timeline */}
            {submitted && matchedNews.length > 0 && (
                <div className="max-w-3xl">

                    {/* Summary bar */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 mb-8 flex items-center gap-6">
                        <div className="text-4xl">🗺️</div>
                        <div className="flex-1">
                            <p className="font-black text-slate-900 text-lg">「{submitted}」的 UAE 情报轨迹</p>
                            <p className="text-xs text-slate-500 mt-1">
                                共 <span className="font-bold text-slate-800">{matchedNews.length}</span> 条相关资讯
                                {dateRange && <> · 覆盖时间 <span className="font-mono font-bold text-slate-700">{dateRange.from}</span> → <span className="font-mono font-bold text-slate-700">{dateRange.to}</span></>}
                            </p>
                        </div>
                        {/* Stage chips */}
                        <div className="hidden sm:flex flex-wrap gap-1.5 max-w-[260px]">
                            {STAGES.filter(s => grouped[s.type]?.length > 0).map(s => (
                                <span key={s.type} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.bg} ${s.color} ${s.border}`}>
                                    {s.icon} {s.label} ({grouped[s.type].length})
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Timeline sections by stage */}
                    {STAGES.filter(s => grouped[s.type]?.length > 0).map(stage => (
                        <div key={stage.type} className="mb-8">
                            {/* Stage header */}
                            <div className={`flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl border ${stage.bg} ${stage.border}`}>
                                <span className="text-xl">{stage.icon}</span>
                                <div>
                                    <span className={`text-sm font-black tracking-tight ${stage.color}`}>{stage.label}</span>
                                    <span className="text-[10px] text-slate-400 ml-2">{NEWS_TYPE_LABELS[stage.type]}</span>
                                </div>
                                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${stage.bg} ${stage.color} ${stage.border}`}>
                                    {grouped[stage.type].length} 条
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="pl-2">
                                {grouped[stage.type]
                                    .sort((a, b) => a.date.localeCompare(b.date))
                                    .map(item => (
                                        <TimelineCard key={item.id} item={item} />
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
