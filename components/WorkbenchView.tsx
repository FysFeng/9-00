import React, { useState } from 'react';
import EntryForm from './EntryForm';
import { useIntelligenceStore } from '../src/store/useIntelligenceStore';
import { fetchAndScreenRSS, generateDailyDigest } from '../services/rssService';
import { NewsItem } from '../types';

type Tab = 'manual' | 'rss' | 'digest';

// ── 每日简报标签页 ──────────────────────────────────────────────────────
function DigestTab({ items }: { items: NewsItem[] }) {
    const [digest, setDigest] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 推送相关状态
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookType, setWebhookType] = useState('wechat');
    const [pushState, setPushState] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
    const [pushMessage, setPushMessage] = useState('');

    const handleGenerate = async () => {
        if (items.length === 0) {
            setError('暂无资讯数据，请先进行自动采集或手动添加资讯。');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await generateDailyDigest(items);
            setDigest(result);
        } catch (e: any) {
            setError(e.message || '生成失败，请稍后重试');
        } finally {
            setLoading(false);
            setPushState('idle'); // 重置推送状态
        }
    };

    const handlePush = async () => {
        if (!webhookUrl) {
            setPushState('error');
            setPushMessage('请输入企业微信/钉钉 Webhook URL');
            return;
        }
        setPushState('pushing');
        try {
            const res = await fetch('/api/collect?action=push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ digest, webhookUrl, type: webhookType })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || '推送失败');
            }
            setPushState('success');
            setPushMessage('推送成功！请在群聊中查看');
        } catch (e: any) {
            setPushState('error');
            setPushMessage(e.message || '网络或接口错误');
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700 mb-1">📋 每日简报</p>
                <p>基于系统内已有的 <span className="font-bold text-blue-700">{items.length}</span> 条资讯，由 Qwen AI 自动提炼生成，包含核心预警、长安动态、竞品动向和大盘概况。</p>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="animate-spin text-base">⟳</span>
                        Qwen 正在生成简报（约 10-30 秒）…
                    </>
                ) : (
                    <>
                        ✦ 生成今日简报
                    </>
                )}
            </button>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {digest && (() => {
                // Parse digest into sections by ### heading
                const lines = digest.split('\n');
                const headerLines: string[] = [];
                const sections: { heading: string; icon: string; lines: string[] }[] = [];
                let current: { heading: string; icon: string; lines: string[] } | null = null;
                let footerLines: string[] = [];
                let inFooter = false;

                for (const line of lines) {
                    if (line.startsWith('### ')) {
                        if (current) sections.push(current);
                        const heading = line.replace('### ', '');
                        // Extract leading emoji if present
                        const iconMatch = heading.match(/^(\p{Emoji}[\uFE0F\u20E3\uFE0F]?\s*)/u);
                        const icon = iconMatch ? iconMatch[1].trim() : '▸';
                        current = { heading, icon, lines: [] };
                        inFooter = false;
                    } else if (line.startsWith('**📌')) {
                        if (current) { sections.push(current); current = null; }
                        inFooter = true;
                        footerLines.push(line);
                    } else if (inFooter) {
                        footerLines.push(line);
                    } else if (current) {
                        current.lines.push(line);
                    } else {
                        headerLines.push(line);
                    }
                }
                if (current) sections.push(current);

                // Color palette: cycles through section types
                const SECTION_COLORS = [
                    { border: 'border-blue-500', bg: 'bg-blue-50', head: 'text-blue-800', pill: 'bg-blue-100 text-blue-700' },
                    { border: 'border-cyan-500', bg: 'bg-cyan-50', head: 'text-cyan-800', pill: 'bg-cyan-100 text-cyan-700' },
                    { border: 'border-emerald-500', bg: 'bg-emerald-50', head: 'text-emerald-800', pill: 'bg-emerald-100 text-emerald-700' },
                    { border: 'border-rose-500', bg: 'bg-rose-50', head: 'text-rose-800', pill: 'bg-rose-100 text-rose-700' },
                    { border: 'border-indigo-500', bg: 'bg-indigo-50', head: 'text-indigo-800', pill: 'bg-indigo-100 text-indigo-700' },
                    { border: 'border-fuchsia-500', bg: 'bg-fuchsia-50', head: 'text-fuchsia-800', pill: 'bg-fuchsia-100 text-fuchsia-700' },
                    { border: 'border-amber-500', bg: 'bg-amber-50', head: 'text-amber-800', pill: 'bg-amber-100 text-amber-700' },
                    { border: 'border-slate-400', bg: 'bg-slate-50', head: 'text-slate-700', pill: 'bg-slate-100 text-slate-600' },
                ];

                // Extract date range from header
                const dateMatch = headerLines.join('\n').match(/情报覆盖时间[：:]\s*(.+)/);
                const dateRange = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split('T')[0];

                return (
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm animate-fadeIn">
                        {/* Dark Header — matches weekly report */}
                        <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b-4 border-red-600">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center shadow-md">
                                    <span className="text-[10px] font-black">UAE</span>
                                </div>
                                <div>
                                    <div className="text-sm font-bold tracking-tight">中东大区市场简报</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Daily Intelligence Report</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right mr-1">
                                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Coverage</div>
                                    <div className="text-xs font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 mt-0.5">{dateRange}</div>
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(digest)}
                                    className="text-[10px] text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-2 py-1 rounded transition-colors"
                                >复制原文</button>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="bg-slate-50 p-4 space-y-3">
                            {sections.map((sec, idx) => {
                                const col = SECTION_COLORS[idx % SECTION_COLORS.length];
                                const bulletLines = sec.lines.filter(l => l.trim().startsWith('-') || l.trim().startsWith('•') || l.trim().startsWith('*'));
                                const otherLines = sec.lines.filter(l => l.trim() && !l.trim().startsWith('-') && !l.trim().startsWith('•') && !l.trim().startsWith('*'));
                                return (
                                    <div key={idx} className={`bg-white rounded-lg border-l-4 ${col.border} border border-l-[4px] border-slate-200 overflow-hidden`}>
                                        <div className={`${col.bg} px-4 py-2 flex items-center gap-2 border-b border-slate-100`}>
                                            <span className={`text-xs font-black uppercase tracking-wider ${col.head}`}>{sec.heading}</span>
                                        </div>
                                        <ul className="px-4 py-3 space-y-1.5">
                                            {bulletLines.map((l, li) => (
                                                <li key={li} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${col.border.replace('border-', 'bg-')}`} />
                                                    <span>{l.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '')}</span>
                                                </li>
                                            ))}
                                            {otherLines.map((l, li) => (
                                                <li key={`o${li}`} className="text-sm text-slate-500 leading-relaxed italic pl-3">{l.replace(/\*\*/g, '')}</li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}

                            {/* Executive Action footer */}
                            {footerLines.length > 0 && (
                                <div className="bg-[#0f172a] text-white rounded-lg p-4">
                                    {footerLines.map((l, i) => {
                                        const clean = l.replace(/\*\*/g, '');
                                        if (l.startsWith('**📌')) return <p key={i} className="font-bold text-amber-400 text-sm mb-2">{clean}</p>;
                                        if (l.trim().startsWith('-')) return <p key={i} className="text-sm text-slate-300 leading-relaxed">&bull; {l.replace(/^-\s*/, '')}</p>;
                                        if (l.trim()) return <p key={i} className="text-sm text-slate-300 leading-relaxed">{clean}</p>;
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer bar */}
                        <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Generated by UAE Auto Insight · Confidential</span>
                        </div>

                        {/* Webhook push panel */}
                        <div className="bg-white px-6 py-4 border-t border-slate-200">
                            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <span>🚀</span> 推送至群聊
                            </h4>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <select
                                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md px-3 py-2 outline-none w-32 shrink-0"
                                        value={webhookType}
                                        onChange={e => setWebhookType(e.target.value)}
                                    >
                                        <option value="wechat">企业微信</option>
                                        <option value="dingtalk">钉钉</option>
                                        <option value="lark">飞书</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="填入群机器人 Webhook URL"
                                        className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400"
                                        value={webhookUrl}
                                        onChange={e => setWebhookUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={handlePush}
                                        disabled={pushState === 'pushing'}
                                        className="shrink-0 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
                                    >
                                        {pushState === 'pushing' ? '发送中...' : '一键推送'}
                                    </button>
                                </div>
                                {pushState === 'success' && <p className="text-xs text-emerald-600 font-semibold">{pushMessage}</p>}
                                {pushState === 'error' && <p className="text-xs text-red-600 font-semibold">{pushMessage}</p>}
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    * 在企业微信群设置中添加「群机器人」，复制 Webhook 链接填入即可。
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

// ── RSS 自动采集标签页 ─────────────────────────────────────────────────
function RSSTab({ onImport }: { onImport: (items: NewsItem[]) => void }) {
    const [days, setDays] = useState(3);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, title: '' });
    const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
    const [error, setError] = useState('');

    const handleFetch = async () => {
        setLoading(true);
        setError('');
        setResult(null);
        setProgress({ current: 0, total: 0, title: '正在拉取 RSS 源…' });

        try {
            const { imported, skipped, total } = await fetchAndScreenRSS(
                days,
                (current, total, title) =>
                    setProgress({ current, total, title: title.slice(0, 50) + (title.length > 50 ? '…' : '') })
            );

            if (imported.length > 0) {
                onImport(imported);
            }
            setResult({ imported: imported.length, skipped });
        } catch (e: any) {
            setError(e.message || '采集失败，请检查网络或 API Key 配置');
        } finally {
            setLoading(false);
            setProgress({ current: 0, total: 0, title: '' });
        }
    };

    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700 mb-1">🔄 RSS 自动采集</p>
                <p>从 DriveArabia、Gulf News、YallaMotor、Google News 等 13 个来源抓取原始资讯，由 Qwen AI 自动筛选相关内容、识别品牌、分类、翻译并生成中文摘要后导入。</p>
            </div>

            {/* 天数选择 */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 shrink-0">抓取范围</label>
                <div className="flex gap-2">
                    {[1, 3, 7].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${days === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            最近 {d} 天
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleFetch}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <span className="animate-spin text-base">⟳</span>
                        AI 正在筛选中，请耐心等待…
                    </>
                ) : (
                    <>
                        ↓ 开始自动采集
                    </>
                )}
            </button>

            {/* 进度条 */}
            {loading && progress.total > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span className="truncate max-w-[80%]">{progress.title}</span>
                        <span className="shrink-0">{progress.current} / {progress.total}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {result && (
                <div className={`p-4 rounded-lg border ${result.imported > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-sm font-semibold text-emerald-800">
                        ✓ 采集完成：导入 <span className="text-emerald-700 font-bold text-base">{result.imported}</span> 条，过滤不相关 {result.skipped} 条
                    </p>
                    {result.imported > 0 && (
                        <p className="text-xs text-emerald-600 mt-1">已自动加入「品牌资讯」页，来源标注为 RSS。</p>
                    )}
                    {result.imported === 0 && (
                        <p className="text-xs text-slate-500 mt-1">近期无新增相关资讯，可尝试扩大抓取天数。</p>
                    )}
                </div>
            )}
        </div>
    );
}

// ── 主组件 ─────────────────────────────────────────────────────────────
export default function WorkbenchView() {
    const { addIntelligence, addBatchIntelligence, customBrands, rawIntelligence } = useIntelligenceStore();
    const [tab, setTab] = useState<Tab>('rss');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'rss', label: '🔄 自动采集' },
        { id: 'digest', label: '📋 每日简报' },
        { id: 'manual', label: '✏️ 手动添加' },
    ];

    return (
        <div className="p-8 lg:p-12 max-w-3xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="mb-7">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    ⚙️ 资讯管理
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">Admin</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">自动采集、AI 简报生成、手动录入</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-7 bg-slate-100 p-1 rounded-lg w-fit">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === 'rss' && (
                <RSSTab onImport={(items) => {
                    // addBatchIntelligence 如果存在则批量添加，否则逐条添加
                    if (typeof (useIntelligenceStore.getState() as any).addBatchIntelligence === 'function') {
                        (useIntelligenceStore.getState() as any).addBatchIntelligence(items);
                    } else {
                        items.forEach(item => addIntelligence(item));
                    }
                }} />
            )}
            {tab === 'digest' && <DigestTab items={rawIntelligence} />}
            {tab === 'manual' && (
                <EntryForm onAdd={addIntelligence} availableBrands={customBrands} />
            )}
        </div>
    );
}
