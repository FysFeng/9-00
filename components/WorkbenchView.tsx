import React, { useState } from 'react';
import EntryForm from './EntryForm';
import { useIntelligenceStore } from '../src/store/useIntelligenceStore';
import { generateDailyDigest } from '../services/rssService';
import { NewsItem } from '../types';

type Tab = 'ingest' | 'digest';

function DigestTab({ items }: { items: NewsItem[] }) {
    const [digest, setDigest] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookType, setWebhookType] = useState('wechat');
    const [pushState, setPushState] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
    const [pushMessage, setPushMessage] = useState('');

    const handleGenerate = async () => {
        if (items.length === 0) {
            setError('暂无资讯数据，请先完成采集或录入。');
            return;
        }

        if (startDate && endDate && startDate > endDate) {
            setError('开始日期不能晚于结束日期。');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const filteredItems = items.filter((item) => {
                if (startDate && item.date < startDate) return false;
                if (endDate && item.date > endDate) return false;
                return true;
            });

            if (filteredItems.length === 0) {
                throw new Error('所选时间段内没有可用于生成简报的资讯。');
            }

            const result = await generateDailyDigest(filteredItems, { startDate, endDate });
            setDigest(result);
        } catch (e: any) {
            setError(e.message || '生成失败，请稍后重试。');
        } finally {
            setLoading(false);
            setPushState('idle');
        }
    };

    const handlePush = async () => {
        if (!digest) {
            setPushState('error');
            setPushMessage('请先生成简报。');
            return;
        }

        if (!webhookUrl) {
            setPushState('error');
            setPushMessage('请输入企业微信、钉钉或飞书 Webhook URL。');
            return;
        }

        setPushState('pushing');
        try {
            const res = await fetch('/api/collect?action=push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ digest, webhookUrl, type: webhookType }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || '推送失败');
            }
            setPushState('success');
            setPushMessage('推送成功，请在群聊中查看。');
        } catch (e: any) {
            setPushState('error');
            setPushMessage(e.message || '网络或接口错误');
        }
    };

    return (
        <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-700 mb-1">每日简报</p>
                <p>按你指定的时间范围生成中文简报，适合晨会同步或直接转发到群聊。</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">开始日期</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">结束日期</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
                {loading ? '生成中...' : '生成简报'}
            </button>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                </div>
            )}

            {digest && (
                <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm animate-fadeIn">
                    <div className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between border-b-4 border-red-600">
                        <div>
                            <div className="text-sm font-bold tracking-tight">阿联酋汽车市场简报</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Briefing Preview</div>
                        </div>
                        <button
                            onClick={() => navigator.clipboard.writeText(digest)}
                            className="text-[10px] text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-2 py-1 rounded transition-colors"
                        >
                            复制原文
                        </button>
                    </div>

                    <div className="bg-white p-6">
                        <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-7 font-sans">{digest}</pre>
                    </div>

                    <div className="bg-white px-6 py-4 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">推送至群聊</h4>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <select
                                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-md px-3 py-2 outline-none w-32 shrink-0"
                                    value={webhookType}
                                    onChange={(e) => setWebhookType(e.target.value)}
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
                                    onChange={(e) => setWebhookUrl(e.target.value)}
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function WorkbenchView() {
    const { addIntelligence, customBrands, rawIntelligence } = useIntelligenceStore();
    const [tab, setTab] = useState<Tab>('ingest');

    const tabs: { id: Tab; label: string }[] = [
        { id: 'ingest', label: '采集与录入' },
        { id: 'digest', label: '每日简报' },
    ];

    return (
        <div className="p-8 lg:p-12 max-w-4xl mx-auto animate-fadeIn">
            <div className="mb-7">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    资讯管理
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">Admin</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">统一处理采集、AI 提炼、手动录入与简报生成。</p>
            </div>

            <div className="flex gap-1 mb-7 bg-slate-100 p-1 rounded-lg w-fit">
                {tabs.map((tabItem) => (
                    <button
                        key={tabItem.id}
                        onClick={() => setTab(tabItem.id)}
                        className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${tab === tabItem.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tabItem.label}
                    </button>
                ))}
            </div>

            {tab === 'ingest' && (
                <EntryForm onAdd={addIntelligence} availableBrands={customBrands} />
            )}

            {tab === 'digest' && <DigestTab items={rawIntelligence} />}
        </div>
    );
}
