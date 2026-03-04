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
            const res = await fetch('/api/push', {
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

            {digest && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">简报内容</h3>
                        <button
                            onClick={() => navigator.clipboard.writeText(digest)}
                            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 transition-colors"
                        >
                            复制
                        </button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                        {digest.split('\n').map((line, i) => {
                            if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-slate-800 mt-0 mb-3">{line.replace('## ', '')}</h2>;
                            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-slate-700 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                            if (line === '---') return <hr key={i} className="border-slate-200 my-3" />;
                            if (line.trim() === '') return <div key={i} className="h-1" />;
                            return <p key={i} className="text-sm text-slate-600 leading-relaxed my-1">{line}</p>;
                        })}
                    </div>

                    {/* Webhook 推送设置 */}
                    <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/50 -mx-6 px-6 pb-2 rounded-b-xl">
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
                                    placeholder="填入群机器人 Webhook URL (https://qyapi.weixin.qq.com/...)"
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

                            {/* 推送状态提示 */}
                            {pushState === 'success' && <p className="text-xs text-emerald-600 font-semibold">{pushMessage}</p>}
                            {pushState === 'error' && <p className="text-xs text-red-600 font-semibold">{pushMessage}</p>}

                            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                                * 提示：在企业微信群中右键或设置中添加「群机器人」，复制 Webhook 链接填入即可。免费且不限量。此操作直接调用外网接口，确保您的网络可访问相关地址。
                            </p>
                        </div>
                    </div>
                </div>
            )}
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
