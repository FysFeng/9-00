import React, { useState } from 'react';
import { FilterState, NewsType } from '../types';
import { NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';

interface SidebarProps {
  currentView: 'dashboard' | 'feed' | 'workbench';
  onChangeView: (view: 'dashboard' | 'feed' | 'workbench') => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableBrands: string[];
  onUpdateBrands: (brands: string[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  filters, 
  setFilters, 
  availableBrands,
  onUpdateBrands
}) => {
  const [isEditingBrands, setIsEditingBrands] = useState(false);
  
  // Navigation Item
  const NavItem = ({ view, icon, label }: { view: 'dashboard' | 'feed' | 'workbench', icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group mb-1 ${
        currentView === view 
          ? 'bg-blue-50 text-blue-700 font-bold border-r-4 border-blue-600 rounded-r-none' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className={`text-lg transition-transform ${currentView === view ? 'scale-110' : ''}`}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  // --- Brand Logic ---
  const isAllBrands = filters.selectedBrands.length === 0;

  const handleBrandAll = () => {
    setFilters(prev => ({ ...prev, selectedBrands: [] }));
  };

  const handleBrandToggle = (brand: string) => {
    if (isEditingBrands) return;
    setFilters(prev => {
      const exists = prev.selectedBrands.includes(brand);
      return {
        ...prev,
        selectedBrands: exists
          ? prev.selectedBrands.filter(b => b !== brand)
          : [...prev.selectedBrands, brand]
      };
    });
  };

  const handleAddBrand = () => {
      const newBrand = prompt("请输入新品牌名称 (e.g. Audi):");
      if (newBrand && !availableBrands.includes(newBrand)) {
          onUpdateBrands([...availableBrands, newBrand]);
      }
  };

  const handleDeleteBrand = (brandToDelete: string) => {
      if (confirm(`确定要删除品牌 "${brandToDelete}" 吗?`)) {
          const newList = availableBrands.filter(b => b !== brandToDelete);
          onUpdateBrands(newList);
          setFilters(prev => ({
              ...prev,
              selectedBrands: prev.selectedBrands.filter(b => b !== brandToDelete)
          }));
      }
  };

  // --- Type Logic ---
  const isAllTypes = filters.selectedTypes.length === 0 || filters.selectedTypes.length === NEWS_TYPES_LIST.length;

  const handleTypeAll = () => {
    setFilters(prev => ({ ...prev, selectedTypes: NEWS_TYPES_LIST }));
  };

  const handleTypeToggle = (type: NewsType) => {
    setFilters(prev => {
      const exists = prev.selectedTypes.includes(type);
      if (exists && prev.selectedTypes.length === 1) {
         return { ...prev, selectedTypes: prev.selectedTypes.filter(t => t !== type) };
      }
      return {
        ...prev,
        selectedTypes: exists
          ? prev.selectedTypes.filter(t => t !== type)
          : [...prev.selectedTypes, type]
      };
    });
  };

  const getTypeColor = (type: NewsType, isSelected: boolean) => {
      if (!isSelected) return 'bg-white text-slate-500 border-slate-200 hover:border-slate-300';
      switch(type) {
          case NewsType.LAUNCH: return 'bg-blue-50 text-blue-600 border-blue-200 font-bold';
          case NewsType.POLICY: return 'bg-red-50 text-red-600 border-red-200 font-bold';
          case NewsType.SALES: return 'bg-emerald-50 text-emerald-600 border-emerald-200 font-bold';
          default: return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white text-slate-800 flex flex-col z-50 border-r border-slate-200 shadow-sm">
      {/* 1. Logo Area */}
      <div className="p-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-500 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-red-200">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                Auto Insight
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">阿联酋市场新闻</p>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <div className="px-3 py-6 space-y-1">
        <NavItem view="dashboard" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} label="数据舱" />
        <NavItem view="feed" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>} label="信息流" />
      </div>

      {/* 3. Command Center (Filters) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-8 bg-slate-50/50">
        
        {/* Type Matrix */}
        <div>
           <div className="flex items-center gap-2 mb-3 justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">数据层级</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {/* ALL BUTTON */}
                <button
                    onClick={handleTypeAll}
                    className={`px-2 py-2.5 rounded-md border text-xs font-bold transition-all duration-200 flex items-center justify-center text-center ${
                       isAllTypes 
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
                            className={`px-2 py-2.5 rounded-md border text-xs font-medium transition-all duration-200 flex items-center justify-center text-center ${getTypeColor(type, isSelected)}`}
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">监控品牌</span>
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
            {/* ALL BUTTON (Hidden in edit mode) */}
            {!isEditingBrands && (
                <button
                    onClick={handleBrandAll}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all font-bold ${
                        isAllBrands
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                    }`}
                >
                    ALL
                </button>
            )}

            {availableBrands.map(brand => {
              const isSelected = filters.selectedBrands.includes(brand);
              return (
                <button
                  key={brand}
                  onClick={() => isEditingBrands ? handleDeleteBrand(brand) : handleBrandToggle(brand)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1 ${
                    isEditingBrands 
                        ? 'bg-white border-red-200 text-slate-400 hover:border-red-500 hover:text-red-500 cursor-pointer border-dashed'
                        : isSelected
                            ? 'bg-red-600 text-white border-red-600 font-bold shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {brand}
                  {isEditingBrands && <span className="text-[10px] ml-1">✕</span>}
                </button>
              );
            })}

            {/* Add Button (Only in edit mode) */}
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

      {/* 4. Workbench Entry */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
         <button 
           onClick={() => onChangeView('workbench')}
           className={`w-full py-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 group ${
             currentView === 'workbench' 
                ? 'bg-slate-800 border-slate-800 text-white' 
                : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:shadow-sm'
           }`}
         >
           <span className="group-hover:rotate-90 transition-transform">⚙️</span> 
           采集中心
           <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 ml-1">仅管理员</span>
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;
