import React from 'react';
import OfferTrackingPanel from './OfferTrackingPanel';

export default function CompetitorTracker() {
  return (
    <div className="p-8 lg:p-10 max-w-[1500px] mx-auto animate-fadeIn">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide">
            Offer Tracker
          </span>
          <span className="text-xs text-slate-500">最近检查：2026-05-26</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">竞品优惠追踪</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-3xl">
          按车型追踪 UAE 市场的价格、月供和优惠权益变化。默认展示重点车型，通过搜索和筛选查看完整车型池。
        </p>
      </header>

      <OfferTrackingPanel />
    </div>
  );
}
