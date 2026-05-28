import React, { useMemo, useState } from 'react';
import { CurrentOffer, OfferChangeType, currentOffers, offerChanges } from '../src/data/offerTracking';

const logicClass: Record<string, string> = {
  AND: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OR: 'bg-amber-50 text-amber-700 border-amber-200',
  'AND + OR': 'bg-orange-50 text-orange-700 border-orange-200',
  PRICE_ONLY: 'bg-slate-50 text-slate-600 border-slate-200',
  SIMPLE: 'bg-blue-50 text-blue-700 border-blue-200',
};

const changeMeta: Record<OfferChangeType, { label: string; className: string }> = {
  PRICE_DOWN: { label: '价格下降', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EMI_UP: { label: '月供上调', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  BENEFIT_ADDED: { label: '权益新增', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  BENEFIT_CLARIFIED: { label: '权益明确', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  NEW_MODEL: { label: '新增车型', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  NO_PUBLIC_CHANGE: { label: '暂无变化', className: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const benefitFilters = [
  { value: 'all', label: '全部权益' },
  { value: 'finance', label: '金融' },
  { value: 'insurance', label: '保险' },
  { value: 'registration', label: '注册' },
  { value: 'service', label: '服务' },
  { value: 'warranty', label: '保修' },
  { value: 'roadside', label: '道路救援' },
  { value: 'tinting', label: '贴膜' },
  { value: 'fuel', label: '燃油' },
  { value: 'charging', label: '充电' },
  { value: 'cashDiscount', label: '现金优惠' },
  { value: 'deferredPayment', label: '延迟付款' },
];

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

function DetailGrid({ offer }: { offer: CurrentOffer }) {
  const fields = detailFields.filter((field) => offer.details[field.key]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4 bg-slate-50">
      {fields.map((field) => (
        <div key={field.key} className="rounded-lg border border-slate-200 bg-white p-3 min-h-[72px]">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">{field.label}</div>
          <div className="text-sm font-semibold text-slate-800 leading-snug">{offer.details[field.key]}</div>
        </div>
      ))}
    </div>
  );
}

function offerHasBenefit(offer: CurrentOffer, benefit: string) {
  if (benefit === 'all') return true;
  return Boolean(offer.details[benefit as keyof CurrentOffer['details']]);
}

const priorityModelIds = [
  'tank-300',
  'byd-seal-7',
  'nissan-altima',
  'tank-500',
  'byd-shark-6',
  'byd-sealion-5',
  'nissan-x-trail',
  'mitsubishi-destinator',
  'haval-h9',
  'jetour-t1',
  'toyota-camry',
  'byd-song-plus',
];

export function OfferAlerts({ compact = false }: { compact?: boolean }) {
  const preferredIds = ['gwm-tank-tank-300-change', 'byd-seal-7-change', 'nissan-altima-change', 'byd-shark-6-change'];
  const preferred = preferredIds
    .map((id) => offerChanges.find((change) => change.id === id))
    .filter(Boolean);
  const fallback = offerChanges.filter((change) => ['PRICE_DOWN', 'EMI_UP', 'BENEFIT_ADDED'].includes(change.changeType));
  const alertChanges = preferred.length > 0 ? preferred : fallback;
  const keyChanges = (compact ? alertChanges.slice(0, 3) : alertChanges.slice(0, 4)) as typeof offerChanges;

  return (
    <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
      <div className="flex justify-between items-start gap-4 mb-5">
        <div>
          <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-blue-600 rounded-full"></div>
            价格变化示例
          </h3>
          <p className="text-xs text-slate-500 mt-1">首页只展示重点变化，不展示完整大表。</p>
        </div>
        <span className="text-xs text-slate-400 font-mono">2026-05-26</span>
      </div>
      <div className="space-y-3">
        {keyChanges.map((change) => {
          const meta = changeMeta[change.changeType];
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
  const [brandFilter, setBrandFilter] = useState('all');
  const [logicFilter, setLogicFilter] = useState('all');
  const [benefitFilter, setBenefitFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [expandedId, setExpandedId] = useState(currentOffers[0]?.id || '');

  const brands = useMemo(() => Array.from(new Set(currentOffers.map((offer) => offer.brand))).sort(), []);

  const filteredOffers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const priority = currentOffers.filter((offer) => {
      const brandMatch = brandFilter === 'all' || offer.brand === brandFilter;
      const logicMatch = logicFilter === 'all' || offer.offerLogic === logicFilter;
      const benefitMatch = offerHasBenefit(offer, benefitFilter);
      const textMatch = !normalizedKeyword || [offer.brand, offer.model, offer.mainOffer, offer.startingEmi, offer.startingPrice]
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword);
      return brandMatch && logicMatch && benefitMatch && textMatch;
    });

    const sorted = priority.slice().sort((a, b) => {
      const aIndex = priorityModelIds.indexOf(a.id);
      const bIndex = priorityModelIds.indexOf(b.id);
      const aScore = aIndex === -1 ? 999 : aIndex;
      const bScore = bIndex === -1 ? 999 : bIndex;
      if (aScore !== bScore) return aScore - bScore;
      return a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model);
    });

    const isDefaultView = brandFilter === 'all' && logicFilter === 'all' && benefitFilter === 'all' && !normalizedKeyword;
    return isDefaultView ? sorted.slice(0, 12) : sorted;
  }, [brandFilter, logicFilter, benefitFilter, keyword]);

  const filteredChanges = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return offerChanges.filter((change) => {
      const brandMatch = brandFilter === 'all' || change.brand === brandFilter;
      const textMatch = !normalizedKeyword || [change.brand, change.model, change.previousValue, change.currentValue, change.impact]
        .join(' ')
        .toLowerCase()
        .includes(normalizedKeyword);
      return brandMatch && textMatch;
    });
  }, [brandFilter, keyword]);

  const summary = {
    tracked: currentOffers.length,
    priceDown: offerChanges.filter((change) => change.changeType === 'PRICE_DOWN').length,
    benefits: offerChanges.filter((change) => change.changeType === 'BENEFIT_ADDED').length,
    emiUp: offerChanges.filter((change) => change.changeType === 'EMI_UP').length,
  };

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
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Offer Tracker</h2>
            <p className="text-sm text-slate-500 mt-1">默认展示重点车型；使用搜索或筛选查看完整车型池。OR / AND 逻辑在展开详情中处理。</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1.3fr] gap-3 mb-5">
          <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm">
            <option value="all">全部品牌</option>
            {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
          </select>
          <select value={logicFilter} onChange={(event) => setLogicFilter(event.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm">
            <option value="all">全部逻辑</option>
            <option value="AND">AND</option>
            <option value="OR">OR</option>
            <option value="AND + OR">AND + OR</option>
            <option value="PRICE_ONLY">仅价格</option>
            <option value="SIMPLE">简单优惠</option>
          </select>
          <select value={benefitFilter} onChange={(event) => setBenefitFilter(event.target.value)} className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm">
            {benefitFilters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索车型或优惠"
            className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>

        {activeTab === 'current' ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-5 py-3 font-semibold">品牌</th>
                    <th className="px-5 py-3 font-semibold">车型</th>
                    <th className="px-5 py-3 font-semibold">月供起步</th>
                    <th className="px-5 py-3 font-semibold">总价起步</th>
                    <th className="px-5 py-3 font-semibold">优惠逻辑</th>
                    <th className="px-5 py-3 font-semibold">主要优惠</th>
                    <th className="px-5 py-3 font-semibold">来源</th>
                    <th className="px-5 py-3 font-semibold">检查日期</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer) => (
                    <React.Fragment key={offer.id}>
                      <tr
                        className="border-b border-slate-100 cursor-pointer hover:bg-blue-50/40 transition-colors"
                        onClick={() => setExpandedId(expandedId === offer.id ? '' : offer.id)}
                      >
                        <td className="px-5 py-4 font-medium text-slate-700">{offer.brand}</td>
                        <td className="px-5 py-4 font-black text-slate-900">{offer.model}</td>
                        <td className="px-5 py-4 text-slate-700">{offer.startingEmi}</td>
                        <td className="px-5 py-4 text-slate-700">{offer.startingPrice}</td>
                        <td className="px-5 py-4"><Badge className={logicClass[offer.offerLogic] || logicClass.SIMPLE}>{offer.offerLogic}</Badge></td>
                        <td className="px-5 py-4 text-slate-700 min-w-[320px]">{offer.mainOffer}</td>
                        <td className="px-5 py-4 text-slate-600">{offer.sourceStatus}</td>
                        <td className="px-5 py-4 text-slate-500 font-mono">{offer.updatedAt}</td>
                      </tr>
                      {expandedId === offer.id && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={8}>
                            <DetailGrid offer={offer} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredOffers.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">当前筛选下没有匹配优惠。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
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
                  {filteredChanges.map((change) => {
                    const meta = changeMeta[change.changeType];
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
                  {filteredChanges.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">当前筛选下没有匹配变化。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
