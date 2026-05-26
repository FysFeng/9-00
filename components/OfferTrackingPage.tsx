import React from 'react';
import OfferTrackingPanel, { OfferAlerts } from './OfferTrackingPanel';

export default function OfferTrackingPage() {
  return (
    <div className="p-8 lg:p-10 max-w-[1600px] mx-auto animate-fadeIn">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide">
            Offer Tracker
          </span>
          <span className="text-xs text-slate-500">最近检查：2026-05-26</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">优惠变化追踪</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-3xl">
          用来跟踪 UAE 竞品车型的价格、月供和优惠权益变化。页面先给出重点提醒，再进入当前优惠和变化记录。
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.35fr] gap-8 mb-8">
        <OfferAlerts compact />
        <section className="bg-white p-6 lg:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
          <h2 className="text-lg font-black text-slate-800 tracking-tight mb-5">页面逻辑</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">第一层</div>
              <div className="mt-2 font-black text-slate-900">重点提醒</div>
              <p className="text-sm text-slate-500 mt-1">只看最近重要变化，避免首页和列表过重。</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">第二层</div>
              <div className="mt-2 font-black text-slate-900">当前优惠 / 变化记录</div>
              <p className="text-sm text-slate-500 mt-1">当前状态和历史变化分开，不混成一张大表。</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">第三层</div>
              <div className="mt-2 font-black text-slate-900">点击展开详情</div>
              <p className="text-sm text-slate-500 mt-1">保险、服务、保修、OR 方案等放在展开层。</p>
            </div>
          </div>
        </section>
      </div>

      <OfferTrackingPanel />
    </div>
  );
}
