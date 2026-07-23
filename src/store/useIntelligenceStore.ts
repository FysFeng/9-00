import { create } from 'zustand';
import { NewsItem, FilterState, NewsType } from '../../types';
import { NEWS_TYPES_LIST, INITIAL_NEWS, DEFAULT_BRANDS } from '../../constants';
import { normalizeNewsBrand } from '../../utils/brandNormalization';

export enum SalesViewMode {
    ALL_MARKET = "ALL_MARKET",
    CHANGAN_VS_CHALLENGERS = "CHANGAN_VS_CHALLENGERS",
    CHANGAN_VS_INCUMBENTS = "CHANGAN_VS_INCUMBENTS"
}

interface IntelligenceStore {
    // --- Data ---
    rawIntelligence: NewsItem[];
    customBrands: string[];

    // --- State ---
    isLoading: boolean;
    dbError: string | null;
    isSaving: boolean;

    // --- Perspectives ---
    salesViewMode: SalesViewMode;
    focusedBrand: string;

    // --- Filters ---
    filters: FilterState;

    // --- Actions ---
    setSalesViewMode: (mode: SalesViewMode) => void;
    setFilters: (filters: Partial<FilterState>) => void;
    fetchData: () => Promise<void>;
    addIntelligence: (item: Omit<NewsItem, 'id'>) => Promise<void>;
    addBatchIntelligence: (items: NewsItem[]) => Promise<void>;
    deleteIntelligence: (id: string) => Promise<void>;
    updateBrands: (brands: string[]) => Promise<void>;
}

const normalizeText = (value: string = '') =>
    value
        .toLowerCase()
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const normalizeUrl = (rawUrl: string = '') => {
    if (!rawUrl) return '';
    try {
        const parsed = new URL(rawUrl);
        parsed.hash = '';
        parsed.hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();

        const blockedParams = new Set([
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'igshid', 'mc_cid', 'mc_eid', 'ref', 'ref_src',
            'guccounter', 'guce_referrer', 'guce_referrer_sig',
        ]);

        [...parsed.searchParams.keys()].forEach((key) => {
            if (blockedParams.has(key.toLowerCase())) parsed.searchParams.delete(key);
        });

        parsed.pathname = parsed.pathname.replace(/\/+$/, '');
        parsed.search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : '';
        return parsed.toString();
    } catch {
        return rawUrl.trim();
    }
};

const buildUrlKey = (item: Pick<NewsItem, 'url'>) => normalizeUrl(item.url || '');

const buildTitleKey = (item: Pick<NewsItem, 'title' | 'date' | 'brand'>) =>
    `${normalizeText(item.title)}::${item.date || ''}::${normalizeText(item.brand || '')}`;

const dedupeNewsItems = (items: NewsItem[]) => {
    const seenUrl = new Set<string>();
    const seenTitle = new Set<string>();
    const result: NewsItem[] = [];

    for (const item of items) {
        const urlKey = buildUrlKey(item);
        const titleKey = buildTitleKey(item);

        if (urlKey && seenUrl.has(urlKey)) continue;
        if (seenTitle.has(titleKey)) continue;

        if (urlKey) seenUrl.add(urlKey);
        seenTitle.add(titleKey);
        result.push(item);
    }

    return result;
};

// 核心圈层定义
export const CHALLENGER_BRANDS = [
    "BYD 比亚迪", "Geely 吉利", "Chery 奇瑞", "GWM 长城", "Jetour 捷途",
    "Changan Deepal 深蓝", "Changan AVATR 阿维塔", "Geely Zeekr 极氪",
    "Geely Lynk & Co 领克", "BYD DENZA 腾势", "Chery Exeed 星途",
    "Chery iCAUR", "SAIC MG 名爵", "Xpeng 小鹏", "NIO 蔚来", "Li Auto 理想"
];

export const INCUMBENT_BRANDS = [
    "Toyota 丰田", "Nissan 日产", "Hyundai 现代", "Kia 起亚",
    "Ford 福特", "Chevrolet 雪佛兰", "Lexus 雷克萨斯", "Honda 本田",
    "Volkswagen 大众", "Mercedes-Benz 奔驰", "BMW 宝马", "Audi 奥迪", "Land Rover 路虎"
];

const defaultEndDate = new Date().toISOString().split('T')[0];
const defaultFilters: FilterState = {
    startDate: '',
    endDate: defaultEndDate,
    selectedBrands: [],
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: ''
};

export const useIntelligenceStore = create<IntelligenceStore>((set, get) => ({
    rawIntelligence: [],
    customBrands: DEFAULT_BRANDS,
    isLoading: true,
    dbError: null,
    isSaving: false,

    salesViewMode: SalesViewMode.ALL_MARKET,
    focusedBrand: "Changan 长安",
    filters: defaultFilters,

    setSalesViewMode: (mode) => {
        const { focusedBrand } = get();
        let newSelectedBrands: string[] = [];

        if (mode === SalesViewMode.CHANGAN_VS_CHALLENGERS) {
            newSelectedBrands = [focusedBrand, ...CHALLENGER_BRANDS];
        } else if (mode === SalesViewMode.CHANGAN_VS_INCUMBENTS) {
            newSelectedBrands = [focusedBrand, ...INCUMBENT_BRANDS];
        } // ALL_MARKET retains [] (all)

        set((state) => ({
            salesViewMode: mode,
            filters: { ...state.filters, selectedBrands: newSelectedBrands }
        }));
    },

    setFilters: (newFilters) =>
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),

    fetchData: async () => {
        set({ isLoading: true, dbError: null });
        try {
            const newsRes = await fetch(`/api/data?type=news&_t=${Date.now()}`, { cache: 'no-store' });
            if (!newsRes.ok) throw new Error("Cloud connection failed");
            const newsData = await newsRes.json();

            // Map old NewsType string values to new NewsType enums for backwards compatibility
            const mappedNewsData = newsData.map((item: NewsItem) => {
                let mappedType = item.type;
                switch (item.type as unknown as string) {
                    case 'New Car Launch': mappedType = NewsType.LAUNCH_PHYSICAL; break;
                    case 'Competitor Dynamics': mappedType = NewsType.COMPETITOR_TACTICS; break;
                    case 'Market Sales': mappedType = NewsType.MARKET_SALES; break;
                    case 'Policy & Regulation': mappedType = NewsType.POLICY; break;
                    case 'Tech & OTA': mappedType = NewsType.TECH_OTA; break;
                    case 'Network & Service': mappedType = NewsType.NETWORK_SERVICE; break;
                    case 'Corp & Strategy': mappedType = NewsType.CORP_STRATEGY; break;
                    case 'Other': mappedType = NewsType.OTHER; break;
                }
                return {
                    ...item,
                    brand: normalizeNewsBrand(item),
                    type: mappedType,
                };
            });

            const brandsRes = await fetch(`/api/data?type=brands&_t=${Date.now()}`, { cache: 'no-store' });
            const brandsData = await brandsRes.json();

            // Merge cloud brands with local defaults to ensure new additions show up
            const mergedBrands = Array.from(new Set([
                ...DEFAULT_BRANDS,
                ...(Array.isArray(brandsData) ? brandsData : [])
            ].map((brand) => normalizeNewsBrand({ brand })).filter(Boolean)));
            const demoStrategyItems = INITIAL_NEWS.filter((item) => item.strategySignals && item.strategySignals.length > 0);

            set({
                rawIntelligence: mappedNewsData.length > 0 ? dedupeNewsItems([...demoStrategyItems, ...mappedNewsData]) : INITIAL_NEWS,
                customBrands: mergedBrands,
                isLoading: false
            });
        } catch (error) {
            console.error("Cloud fetch error:", error);
            set({
                dbError: "离线模式：无法连接云端数据库",
                rawIntelligence: INITIAL_NEWS,
                customBrands: DEFAULT_BRANDS,
                isLoading: false
            });
        }
    },

    addIntelligence: async (item) => {
        const { rawIntelligence } = get();
        set({ isSaving: true });

        const newItem = { ...item, id: Math.random().toString(36).substring(2, 15) };
        const updated = dedupeNewsItems([newItem, ...rawIntelligence]);

        // Optimistic Update
        set({ rawIntelligence: updated });

        try {
            const res = await fetch('/api/data?type=news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (!res.ok) throw new Error('Save failed');
        } catch (e) {
            // Rollback
            set({ rawIntelligence });
            console.error("Save error:", e);
            alert("保存失败，已撤销操作。请检查网络或服务端配置。");
        } finally {
            set({ isSaving: false });
        }
    },

    addBatchIntelligence: async (items) => {
        const { rawIntelligence } = get();
        set({ isSaving: true });
        const updated = dedupeNewsItems([...items, ...rawIntelligence]);
        set({ rawIntelligence: updated });
        try {
            const res = await fetch('/api/data?type=news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (!res.ok) throw new Error('Batch save failed');
        } catch (e) {
            set({ rawIntelligence });
            console.error("Batch save error:", e);
        } finally {
            set({ isSaving: false });
        }
    },

    deleteIntelligence: async (id) => {
        if (!confirm("确定删除吗？")) return;

        const { rawIntelligence } = get();
        set({ isSaving: true });

        const updated = rawIntelligence.filter(i => i.id !== id);
        set({ rawIntelligence: updated });

        try {
            const res = await fetch('/api/data?type=news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (!res.ok) throw new Error('Delete failed');
        } catch (e) {
            set({ rawIntelligence });
            alert("删除失败，已恢复。");
        } finally {
            set({ isSaving: false });
        }
    },

    updateBrands: async (brands) => {
        set({ customBrands: brands });
        try {
            await fetch('/api/data?type=brands', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(brands)
            });
        } catch (e) {
            console.error("Failed to save brands", e);
        }
    }
}));
