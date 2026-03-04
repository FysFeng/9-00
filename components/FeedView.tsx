import React, { useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useIntelligenceStore } from '../src/store/useIntelligenceStore';
import NewsCard from './NewsCard';

export default function FeedView() {
    const {
        rawIntelligence,
        filters,
        setFilters,
        deleteIntelligence
    } = useIntelligenceStore();

    const [localSearch, setLocalSearch] = React.useState(filters.searchQuery);
    const [debouncedSearch] = useDebounce(localSearch, 300);

    // Sync debounced search to global store
    React.useEffect(() => {
        setFilters({ searchQuery: debouncedSearch });
    }, [debouncedSearch, setFilters]);

    const filteredNews = useMemo(() => {
        return rawIntelligence.filter(item => {
            const startMatch = !filters.startDate || item.date >= filters.startDate;
            const endMatch = !filters.endDate || item.date <= filters.endDate;
            const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(item.brand);
            const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
            const searchLower = filters.searchQuery.toLowerCase();
            const searchMatch = !filters.searchQuery ||
                item.title.toLowerCase().includes(searchLower) ||
                item.summary.toLowerCase().includes(searchLower) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(searchLower)));

            return startMatch && endMatch && brandMatch && typeMatch && searchMatch;
        })
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [rawIntelligence, filters]);

    return (
        <div className="p-8 lg:p-12 max-w-6xl mx-auto animate-fadeIn">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">情报流 (Intelligence Feed)</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        筛选结果: {filteredNews.length} 条资讯
                    </p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="搜索标题、内容或标签..."
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                    />
                </div>
            </header>

            <div className="space-y-6 pb-20">
                {filteredNews.length > 0 ? (
                    filteredNews.map(item => (
                        <NewsCard key={item.id} item={item} onDelete={deleteIntelligence} />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-400">当前筛选条件下暂无情报数据</p>
                        <button
                            onClick={() => {
                                setLocalSearch('');
                                setFilters({ selectedBrands: [], searchQuery: '' });
                            }}
                            className="text-blue-500 text-sm mt-2 hover:underline"
                        >
                            清除筛选条件
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
