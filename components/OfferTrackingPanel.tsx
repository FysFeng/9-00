import React, { useMemo, useState } from 'react';
import { CurrentOffer, OfferChange, currentOffers, offerChanges } from '../src/data/offerTracking';

const logicClass: Record<string, string> = {
  AND: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OR: 'bg-amber-50 text-amber-700 border-amber-200',
  'AND + OR': 'bg-orange-50 text-orange-700 border-orange-200',
  PRICE_ONLY: 'bg-slate-50 text-slate-600 border-slate-200',
  SIMPLE: 'bg-blue-50 text-blue-700 border-blue-200',
};

const changeClass: Record<string, { label: string; className: string }> = {
  PRICE_DOWN: { label: '价格下降', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EMI_UP: { label: '月供上调', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  BENEFIT_ADDED: { label: '权益新增', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  BENEFIT_CLARIFIED: { label: '权益明确', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  NEW_MODEL: { label: '新增车型', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  NO_PUBLIC_CHANGE: { label: '暂无变化', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const detailFields: Array<{ key: keyof CurrentOffer['details']; label: string }> = [
  { key: 'finance', label: '金融' },
  { key: 'insurance', label: '保险' },
  { key: 'registration', label: '注册' },
  { key: 'service', label: '服务' },
  { key: 'warranty', label: '保修' },
  { key: 'roadside', label: '道路救援' },
  { key: 'tinting', label: '贴膜' },
  { key: 'charging', label: '充电' },
  { key: 'fuel', label: '燃油' },
  { key: 'cashDiscount', label: '现金优惠' },
  { key: 'deferredPayment', label: '延迟付款' },
  { key: 'optionA', label: '方案 A' },
  { key: 'optionB', label: '方案 B' },
  { key: 'note', label: '备注' },
];

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

function OfferDetails({ offer }: { offer: CurrentOffer }) {
  const visibleFields = detailFields.filter((field) => offer.details[field.key]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4 bg-slate-50">
      {visibleFields.map((field) => (
        <div key={field.key} className="rounded-lg border border-slate-200 bg-white p-3 min-h-[72px]">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{field.label}</div>
          <div className="text-sm font-semibold text-slate-800 leading-snug">{offer.details[field.key]}</div>
        </div>
      ))}
    </div>
  );
}

function CurrentOfferTable() {
  const [expandedId, setExpandedId] = useState(currentOffers[0]?.id || '');

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-5 py-3 font-semibold">品牌</th>
              <th className="px-5 py-3 font-semibold">车型</th>
              <th className="px-5 py-3 font-semibold">月供起步</th>
              <th className="px-5 py-3 font-semibold">总价起步</th>
              <th className="px-5 py-3 font-semibold">优惠逻辑</th>
              <th className="px-5 py-3 font-semibold">主要优惠</th>
              <th className="px-5 py-3 font-semibold">来源状态</th>
              <th className="px-5 py-3 font-semibold">更新时间</th>
            </tr>
          </thead>
          <tbody>
            {currentOffers.map((offer) => (
              <React.Fragment key={offer.id}>
                <tr
                  className="border-b border-slate-100 cursor-pointer hover:bg-blue-50/40 transition-colors"
                  onClick={() => setExpandedId(expandedId === offer.id ? '' : offer.id)}
                >
                  <td className="px-5 py-4 font-medium text-slate-700">{offer.brand}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{offer.model}</td>
                  <td className="px-5 py-4 text-slate-700">{offer.startingEmi}</td>
                  <td className="px-5 py-4 text-slate-700">{offer.startingPrice}</td>
                  <td className="px-5 py-4">
                    <Badge className={logicClass[offer.offerLogic] || logicClass.SIMPLE}>{offer.offerLogic}</Badge>
                  </td>
                  <td className="px-5 py-4 text-slate-700 min-w-[280px]">{offer.mainOffer}</td>
                  <td className="px-5 py-4 text-slate-600">{offer.sourceStatus}</td>
                  <td className="px-5 py-4 text-slate-500 font-mono">{offer.updatedAt}</td>
                </tr>
                {expandedId === offer.id && (
                  <tr className="border-b border-slate-100">
                    <td colSpan={8}>
                      <OfferDetails offer={offer} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangeTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="px-5 py-3 font-semibold">日期</th>
              <th className="px-5 py-3 font-semibold">品牌</th>
              <th className="px-5 py-3 font-semibold">车型</th>
              <th className="px-5 py-3 font-semibold">变化类型</th>
              <th className="px-5 py-3 font-semibold">变化前</th>
              <th className="px-5 py-3 font-semibold">变化后</th>
              <th className="px-5 py-3 font-semibold">影响判断</th>
              <th className="px-5 py-3 font-semibold">来源</th>
            </tr>
          </thead>
          <tbody>
            {offerChanges.map((change) => {
              const meta = changeClass[change.changeType];
              return (
                <tr key={change.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                  <td className="px-5 py-4 text-slate-500 font-mono">{change.date}</td>
                  <td className="px-5 py-4 font-medium text-slate-700">{change.brand}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{change.model}</td>
                  <td className="px-5 py-4"><Badge className={meta.className}>{meta.label}</Badge></td>
                  <td className="px-5 py-4 text-slate-600">{change.previousValue}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{change.currentValue}</td>
                  <td className="px-5 py-4 text-slate-600 min-w-[260px]">{change.impact}</td>
                  <td className="px-5 py-4 text-blue-700 font-semibold">{change.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OfferAlerts({ compact = false }: { compact?: boolean }) {
  const keyChanges = offerChanges.slice(0, compact ? 3 : 4);

  return (
    <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
      <div className="flex justify-between items-start gap-4 mb-5">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-blue-600 rounded-full"></div>
            近期优惠变化提醒
          </h3>
          <p className="text-xs text-slate-500 mt-1">首页只展示重点变化，完整明细在竞品策略追踪中查看。</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">2026-05-26</span>
      </div>
      <div className="space-y-3">
        {keyChanges.map((change) => {
          const meta = changeClass[change.changeType];
          return (
            <div key={change.id} className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between gap-3 mb-2">
                <div>
                  <div className="font-black text-slate-900">{change.brand} / {change.model}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{change.source}</div>
                </div>
                <Badge className={meta.className}>{meta.label}</Badge>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-sm items-center">
                <span className="text-slate-500">{change.previousValue}</span>
                <span className="text-slate-300">→</span>
                <span className="font-semibold text-slate-900">{change.currentValue}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OfferTrackingPanel() {
  const [activeTab, setActiveTab] = useState<'current' | 'changes'>('current');

  const summary = useMemo(() => {
    return {
      tracked: currentOffers.length,
      priceDown: offerChanges.filter((change) => change.changeType === 'PRICE_DOWN').length,
      benefits: offerChanges.filter((change) => change.changeType === 'BENEFIT_ADDED').length,
      emiUp: offerChanges.filter((change) => change.changeType === 'EMI_UP').length,
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">已追踪车型</div>
          <div className="mt-2 text-3xl font-black text-slate-900">{summary.tracked}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">价格下降</div>
          <div className="mt-2 text-3xl font-black text-emerald-700">{summary.priceDown}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">权益新增</div>
          <div className="mt-2 text-3xl font-black text-blue-700">{summary.benefits}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-black text-slate-400 uppercase tracking-wider">月供上调</div>
          <div className="mt-2 text-3xl font-black text-rose-700">{summary.emiUp}</div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">优惠追踪</h2>
            <p className="text-sm text-slate-500 mt-1">先看当前优惠，再看变化记录。复杂优惠会按 AND / OR 展开，避免误读。</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'current' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            >
              当前优惠
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'changes' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
            >
              变化记录
            </button>
          </div>
        </div>

        {activeTab === 'current' ? <CurrentOfferTable /> : <ChangeTable />}
      </section>
    </div>
  );
}
