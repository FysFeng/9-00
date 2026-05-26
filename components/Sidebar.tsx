import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useIntelligenceStore, SalesViewMode } from '../src/store/useIntelligenceStore';
import { NewsType } from '../types';
import { NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';
import WeeklyReportModal from './WeeklyReportModal';

const Sidebar = () => {
  const {
    filters,
    setFilters,
    customBrands,
    updateBrands,
    salesViewMode,
    setSalesViewMode,
    rawIntelligence
  } = useIntelligenceStore();

  const [isEditingBrands, setIsEditingBrands] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const location = useLocation();

  // Navigation Logic
  const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group mb-1 ${isActive
          ? 'bg-blue-50 text-blue-800 font-bold border-r-4 border-blue-600 rounded-r-none'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
      >
        <span className={`text-lg transition-transform ${isActive ? 'scale-110 text-blue-600' : ''}`}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </NavLink>
    );
  };

  // --- Brand Logic ---
  const isAllBrands = filters.selectedBrands.length === 0;

  const handleBrandAll = () => setFilters({ selectedBrands: [] });

  const handleBrandToggle = (brand: string) => {
    if (isEditingBrands) return;
    const exists = filters.selectedBrands.includes(brand);
    setFilters({
      selectedBrands: exists
        ? filters.selectedBrands.filter(b => b !== brand)
        : [...filters.selectedBrands, brand]
    });
  };

  const handleAddBrand = () => {
    const newBrand = prompt("请输入新品牌名称 (e.g. Audi):");
    if (newBrand && !customBrands.includes(newBrand)) {
      updateBrands([...customBrands, newBrand]);
    }
  };

  const handleDeleteBrand = (brandToDelete: string) => {
    if (confirm(`确定要删除品牌 "${brandToDelete}" 吗?`)) {
      updateBrands(customBrands.filter(b => b !== brandToDelete));
      setFilters({
        selectedBrands: filters.selectedBrands.filter(b => b !== brandToDelete)
      });
    }
  };

  // --- Type Logic ---
  const isAllTypes = filters.selectedTypes.length === 0 || filters.selectedTypes.length === NEWS_TYPES_LIST.length;

  const handleTypeAll = () => setFilters({ selectedTypes: NEWS_TYPES_LIST });

  const handleTypeToggle = (type: NewsType) => {
    const exists = filters.selectedTypes.includes(type);
    if (exists && filters.selectedTypes.length === 1) {
      setFilters({ selectedTypes: filters.selectedTypes.filter(t => t !== type) });
      return;
    }
    setFilters({
      selectedTypes: exists
        ? filters.selectedTypes.filter(t => t !== type)
        : [...filters.selectedTypes, type]
    });
  };

  const getTypeColor = (type: NewsType, isSelected: boolean) => {
    if (!isSelected) return 'bg-white text-slate-500 border-slate-200 hover:border-slate-300';
    switch (type) {
      case NewsType.LAUNCH_PHYSICAL: return 'bg-blue-50 text-blue-600 border-blue-200 font-bold';
      case NewsType.POLICY: return 'bg-red-50 text-red-600 border-red-200 font-bold';
      case NewsType.MARKET_SALES: return 'bg-emerald-50 text-emerald-600 border-emerald-200 font-bold';
      case NewsType.TECH_OTA: return 'bg-cyan-50 text-cyan-600 border-cyan-200 font-bold';
      case NewsType.NETWORK_SERVICE: return 'bg-indigo-50 text-indigo-600 border-indigo-200 font-bold';
      default: return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white text-slate-800 flex flex-col z-50 border-r border-slate-200 shadow-sm">
      {/* 1. Logo Area */}
      <div className="p-6 pb-4 border-b border-slate-100 bg-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-blue-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              Auto Insight
            </h1>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">
              Changan Sales Team
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <div className="px-3 py-6 space-y-1 border-b border-slate-100">
        <NavItem to="/" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} label="市场动态总览" />
        <NavItem to="/feed" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>} label="品牌资讯" />
        <NavItem to="/timeline" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} label="车型生命周期" />
      </div>
        <NavItem to="/tracker" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" /></svg>} label="竞品策略追踪" />
        <NavItem to="/offers" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m-7-6a7 7 0 1114 0 7 7 0 01-14 0z" /></svg>} label="优惠追踪" />

      {/* 3. Command Center (Filters) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-6 bg-slate-50/50">

        {/* View Mode Switch */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">视角切换</span>
          </div>
          <select
            value={salesViewMode}
            onChange={(e) => setSalesViewMode(e.target.value as SalesViewMode)}
            className="w-full text-sm font-medium border-slate-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value={SalesViewMode.ALL_MARKET}>阿联酋全市场</option>
            <option value={SalesViewMode.CHANGAN_VS_CHALLENGERS}>长安 VS 中国出海品牌</option>
            <option value={SalesViewMode.CHANGAN_VS_INCUMBENTS}>长安 VS 日韩传统品牌</option>
          </select>
        </div>

        {/* Type Matrix */}
        <div>
          <div className="flex items-center gap-2 mb-3 justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">资讯类型</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleTypeAll}
              className={`px-2 py-2.5 rounded-md border text-xs font-bold transition-all duration-200 flex items-center justify-center text-center ${isAllTypes
                ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
            >
              全部类型
            </button>

            {NEWS_TYPES_LIST.map(type => {
              const isSelected = filters.selectedTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-2 py-2.5 rounded-md border text-[11px] font-medium transition-all duration-200 flex items-center justify-center text-center leading-tight ${getTypeColor(type, isSelected)}`}
                >
                  {NEWS_TYPE_LABELS[type]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Brand Matrix (With Management) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">品牌筛选</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingBrands(!isEditingBrands)}
                className={`text-xs p-1.5 rounded hover:bg-slate-200 transition-colors ${isEditingBrands ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}
                title="管理品牌"
              >
                ⚙️ 管理
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditingBrands && (
              <button
                onClick={handleBrandAll}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all font-bold ${isAllBrands
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
              >
                全部品牌
              </button>
            )}

            {customBrands.map(brand => {
              const isSelected = filters.selectedBrands.includes(brand);
              const isChangan = brand.includes("Changan");

              let baseBtnStyle = isSelected
                ? (isChangan ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md'
                  : 'bg-slate-700 text-white border-slate-700 font-bold shadow-md')
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900';

              if (isEditingBrands) {
                baseBtnStyle = 'bg-white border-red-200 text-slate-400 hover:border-red-500 hover:text-red-500 cursor-pointer border-dashed';
              }

              return (
                <button
                  key={brand}
                  onClick={() => isEditingBrands ? handleDeleteBrand(brand) : handleBrandToggle(brand)}
                  className={`px-3 py-1.5 text-[11px] rounded-full border transition-all flex items-center gap-1 ${baseBtnStyle}`}
                >
                  {brand}
                  {isEditingBrands && <span className="text-[10px] ml-1">✕</span>}
                </button>
              );
            })}

            {isEditingBrands && (
              <button
                onClick={handleAddBrand}
                className="px-3 py-1.5 text-xs rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all font-bold"
              >
                + 新增
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. Tools & Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <button
          onClick={() => setIsWeeklyReportOpen(true)}
          className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:text-slate-900 hover:border-slate-400 hover:bg-white transition-all flex items-center justify-center gap-2 group shadow-sm bg-slate-100"
        >
          <span className="group-hover:scale-110 transition-transform">📊</span>
          生成系统周报
          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 ml-1 font-semibold">Poster</span>
        </button>

        <NavLink
          to="/workbench"
          className={({ isActive }) => `w-full py-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 group ${isActive
            ? 'bg-blue-800 border-blue-800 text-white shadow-md'
            : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
        >
          <span className="group-hover:rotate-90 transition-transform">⚙️</span>
          添加/管理资讯
          <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded border border-slate-300 ml-1">Admin</span>
        </NavLink>
      </div>

      {isWeeklyReportOpen && (
        <WeeklyReportModal
          isOpen={isWeeklyReportOpen}
          onClose={() => setIsWeeklyReportOpen(false)}
          allNews={rawIntelligence}
        />
      )}
    </aside>
  );
};

export default Sidebar;
