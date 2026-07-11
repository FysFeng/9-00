import React, { useEffect, useMemo, useState } from 'react';
import { useIntelligenceStore } from '../src/store/useIntelligenceStore';
import { NewsItem, StrategySignal, StrategySignalCategory } from '../types';

type TrackerRow = {
  key: string;
  brand: string;
  model: string;
  msrp: string;
  currency: string;
  latestChangeDate: string;
  recordsCount: number;
  latestByCategory: Partial<Record<StrategySignalCategory, SignalRecord>>;
  allRecords: SignalRecord[];
};

type BrandOption = {
  label: string;
  value: string;
};

type SignalRecord = {
  id: string;
  date: string;
  brand: string;
  model: string;
  category: StrategySignalCategory;
  action: string;
  msrp: string;
  currency: string;
  previousValue: string;
  currentValue: string;
  note: string;
  rawExcerpt: string;
  source: string;
  url: string;
  title: string;
};

const CATEGORY_LABELS: Record<StrategySignalCategory, string> = {
  price: '价格',
  finance: '金融',
  insurance: '保险/延保',
  trade_in: '置换',
  service: '服务/保养',
  campaign: '营销活动',
  distribution: '渠道',
  inventory: '库存/现车',
  charging: '补能',
  delivery: '交付',
  buyback: '回购/保值',
  fleet: '大客户',
  bundle: '礼包/捆绑',
  other: '其他策略',
};

const PRIMARY_COLUMNS: StrategySignalCategory[] = [
  'price',
  'finance',
  'insurance',
  'trade_in',
  'service',
  'other',
];

const LOOKBACK_OPTIONS = [30, 60, 90, 180];
const PAGE_SIZE = 10;

const BRAND_NORMALIZATION_RULES: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'BYD 比亚迪', patterns: [/\bbyd\b/i, /比亚迪/] },
  { label: 'Jetour 捷途', patterns: [/\bjetour\b/i, /捷途/] },
  { label: 'Toyota 丰田', patterns: [/\btoyota\b/i, /丰田/] },
  { label: 'GWM 长城', patterns: [/\bgwm\b/i, /\bhaval\b/i, /\btank\b/i, /长城/] },
  { label: 'Nissan 日产', patterns: [/\bnissan\b/i, /日产/] },
  { label: 'Mitsubishi 三菱', patterns: [/\bmitsubishi\b/i, /三菱/] },
  { label: 'Geely 吉利', patterns: [/\bgeely\b/i, /吉利/] },
  { label: 'Chery iCAUR', patterns: [/\bicaur\b/i, /奇瑞/] },
  { label: 'MG 名爵', patterns: [/\bmg\b/i, /名爵/] },
];

const normalizeBrandName = (brand: string = '') => {
  const trimmed = brand.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (
    lower === 'other'
    || lower.startsWith('other ')
    || lower.includes('policy')
    || trimmed.includes('政策')
    || trimmed.includes('鏀跨瓥')
  ) {
    return '';
  }

  return BRAND_NORMALIZATION_RULES.find((rule) =>
    rule.patterns.some((pattern) => pattern.test(trimmed)),
  )?.label || trimmed;
};

const isMetaBrand = (brand: string) => !normalizeBrandName(brand);

const normalizeText = (value: string = '') =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pickModel = (item: NewsItem, signal?: StrategySignal) =>
  signal?.model?.trim() || item.model?.trim() || '';

const pickMsrp = (item: NewsItem, signal?: StrategySignal) =>
  signal?.msrp?.trim() || item.msrp?.trim() || '';

const pickCurrency = (item: NewsItem, signal?: StrategySignal) =>
  signal?.currency?.trim() || item.currency?.trim() || 'AED';

const formatSignalCell = (record?: SignalRecord) => {
  if (!record) return '-';

  const parts = [record.action];
  if (record.previousValue && record.currentValue) parts.push(`${record.previousValue} -> ${record.currentValue}`);
  else if (record.currentValue) parts.push(record.currentValue);
  else if (record.note) parts.push(record.note);

  return parts.join(' | ');
};

const pickCategoryText = (row: TrackerRow, categories: StrategySignalCategory[]) => {
  const values = categories
    .map((category) => formatSignalCell(row.latestByCategory[category]))
    .filter((value) => value && value !== '-');
  return values.length > 0 ? values.join('；') : '-';
};

const getRowPage = (rows: TrackerRow[], page: number) =>
  rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

const hasStructuredSignals = (items: NewsItem[]) =>
  items.some((item) => item.strategySignals && item.strategySignals.length > 0);

const matchesKeyword = (record: SignalRecord, keyword: string) => {
  if (!keyword) return true;
  return [
    record.model,
    record.action,
    record.note,
    record.rawExcerpt,
    record.title,
  ].some((value) => normalizeText(value).includes(keyword));
};

function buildSignalRecords(items: NewsItem[], cutoffDate: string) {
  const records: SignalRecord[] = [];

  for (const item of items) {
    if (!item.strategySignals || item.strategySignals.length === 0) continue;
    if (item.date < cutoffDate) continue;

    for (let index = 0; index < item.strategySignals.length; index += 1) {
      const signal = item.strategySignals[index];
      const model = pickModel(item, signal);
      if (!model) continue;

      records.push({
        id: `${item.id}-${index}`,
        date: item.date,
        brand: normalizeBrandName(item.brand),
        model,
        category: signal.category,
        action: signal.action,
        msrp: pickMsrp(item, signal),
        currency: pickCurrency(item, signal),
        previousValue: signal.previous_value || '',
        currentValue: signal.current_value || '',
        note: signal.note || '',
        rawExcerpt: signal.raw_excerpt || '',
        source: item.source,
        url: item.url,
        title: item.title,
      });
    }
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

function buildTrackerRows(records: SignalRecord[]) {
  const rowMap = new Map<string, TrackerRow>();

  for (const record of records) {
    if (!record.brand) continue;
    const key = `${record.brand}::${normalizeText(record.model)}`;
    const existing = rowMap.get(key);

    if (!existing) {
      rowMap.set(key, {
        key,
        brand: record.brand,
        model: record.model,
        msrp: record.msrp,
        currency: record.currency,
        latestChangeDate: record.date,
        recordsCount: 1,
        latestByCategory: { [record.category]: record },
        allRecords: [record],
      });
      continue;
    }

    existing.recordsCount += 1;
    existing.allRecords.push(record);
    if (!existing.latestByCategory[record.category]) {
      existing.latestByCategory[record.category] = record;
    }
    if (!existing.msrp && record.msrp) {
      existing.msrp = record.msrp;
      existing.currency = record.currency;
    }
    if (record.date > existing.latestChangeDate) {
      existing.latestChangeDate = record.date;
    }
  }

  return Array.from(rowMap.values())
    .map((row) => ({
      ...row,
      allRecords: row.allRecords.sort((a, b) => b.date.localeCompare(a.date)),
    }))
    .sort((a, b) => b.latestChangeDate.localeCompare(a.latestChangeDate));
}

function DetailTable({ row }: { row: TrackerRow }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{row.brand} / {row.model}</h3>
            <p className="text-sm text-slate-500 mt-1">
              指导价：{row.msrp ? `${row.currency} ${row.msrp}` : '暂无记录'} · 近窗口记录 {row.recordsCount} 条
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">最近变化：{row.latestChangeDate || '-'}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] text-sm table-fixed">
          <thead className="bg-white">
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="w-[110px] px-5 py-3 font-semibold">日期</th>
              <th className="w-[220px] px-5 py-3 font-semibold">动作类型</th>
              <th className="w-[140px] px-5 py-3 font-semibold">变化前</th>
              <th className="w-[140px] px-5 py-3 font-semibold">变化后</th>
              <th className="w-[130px] px-5 py-3 font-semibold">指导价</th>
              <th className="w-[220px] px-5 py-3 font-semibold">说明</th>
              <th className="w-[150px] px-5 py-3 font-semibold">来源</th>
            </tr>
          </thead>
          <tbody>
            {row.allRecords.map((record) => (
              <tr key={record.id} className="border-b border-slate-100 align-top">
                <td className="px-5 py-4 text-slate-500 font-mono">{record.date}</td>
                <td className="px-5 py-4 break-words">
                  <div className="font-semibold text-slate-900">{CATEGORY_LABELS[record.category]}</div>
                  <div className="text-slate-500 mt-1">{record.action}</div>
                </td>
                <td className="px-5 py-4 text-slate-600 break-words">{record.previousValue || '-'}</td>
                <td className="px-5 py-4 text-slate-600 break-words">{record.currentValue || '-'}</td>
                <td className="px-5 py-4 text-slate-600 break-words">{record.msrp ? `${record.currency} ${record.msrp}` : '-'}</td>
                <td className="px-5 py-4 text-slate-600 break-words leading-relaxed">{record.note || record.rawExcerpt || '-'}</td>
                <td className="px-5 py-4 text-slate-600 break-words">
                  <div>{record.source}</div>
                  {record.url && record.url !== '#' && (
                    <a href={record.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-1 inline-block">
                      查看原文
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function CompetitorTracker() {
  const { rawIntelligence } = useIntelligenceStore();
  const hasSignals = useMemo(() => hasStructuredSignals(rawIntelligence), [rawIntelligence]);

  const brandOptions = useMemo<BrandOption[]>(() => {
    const brands = Array.from(new Set(
      rawIntelligence
        .filter((item) => item.strategySignals && item.strategySignals.length > 0)
        .map((item) => normalizeBrandName(item.brand))
        .filter(Boolean),
    )).sort((a, b) => a.localeCompare(b));

    return [{ label: '全部品牌', value: 'ALL' }, ...brands.map((brand) => ({ label: brand, value: brand }))];
  }, [rawIntelligence]);

  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [keywordInput, setKeywordInput] = useState('');
  const [lookbackDays, setLookbackDays] = useState(90);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!brandOptions.some((option) => option.value === selectedBrand)) {
      setSelectedBrand('ALL');
    }
  }, [brandOptions, selectedBrand]);

  const cutoffDate = useMemo(() => {
    const current = new Date();
    current.setDate(current.getDate() - lookbackDays);
    return current.toISOString().split('T')[0];
  }, [lookbackDays]);

  const keyword = useMemo(() => normalizeText(keywordInput), [keywordInput]);

  const signalRecords = useMemo(() => {
    const scoped = rawIntelligence.filter((item) => {
      if (selectedBrand === 'ALL') return !isMetaBrand(item.brand);
      return normalizeBrandName(item.brand) === selectedBrand;
    });
    return buildSignalRecords(scoped, cutoffDate).filter((record) => matchesKeyword(record, keyword));
  }, [rawIntelligence, selectedBrand, cutoffDate, keyword]);

  const rows = useMemo(() => buildTrackerRows(signalRecords), [signalRecords]);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(() => getRowPage(rows, Math.min(page, totalPages)), [rows, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [selectedBrand, keyword, lookbackDays]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="p-8 lg:p-10 max-w-[1500px] mx-auto animate-fadeIn">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide">
            Offer Tracker
          </span>
          <span className="text-xs text-slate-500">按车型聚合价格、金融、权益和渠道优惠变化</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">竞品优惠追踪</h1>
        <p className="mt-2 text-sm text-slate-500">
          每一行代表一个品牌车型组合。默认展示全部品牌，按 10 行分页，方便直接汇报和截图。
        </p>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_180px] gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">品牌</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white"
              disabled={brandOptions.length === 0}
            >
              {brandOptions.length > 0 ? brandOptions.map((brand) => (
                <option key={brand.value} value={brand.value}>{brand.label}</option>
              )) : (
                <option value="">暂无品牌数据</option>
              )}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">车型关键词</label>
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="例如 Tank 500 / Monjaro / Atto 3"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">时间范围</label>
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {LOOKBACK_OPTIONS.map((days) => (
                <option key={days} value={days}>最近 {days} 天</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">车型策略总表</h2>
            <p className="text-sm text-slate-500 mt-1">展示每个车型最近的价格、金融、保险、置换、服务和其他策略。</p>
          </div>
          <span className="text-xs text-slate-400">共 {rows.length} 个车型 · 第 {Math.min(page, totalPages)} / {totalPages} 页</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-400">
              {hasSignals ? '当前筛选下还没有优惠变化记录' : '暂无结构化优惠变化记录'}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              采集新闻并完成 AI 提取后，价格、金融、保险、置换等变化会自动汇总到这里。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1040px] text-sm table-fixed">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="w-[130px] px-5 py-3 font-semibold">品牌</th>
                  <th className="w-[135px] px-5 py-3 font-semibold">车型</th>
                  <th className="w-[190px] px-5 py-3 font-semibold">价格/月供</th>
                  <th className="w-[190px] px-5 py-3 font-semibold">金融/保险</th>
                  <th className="w-[210px] px-5 py-3 font-semibold">服务权益</th>
                  <th className="w-[190px] px-5 py-3 font-semibold">其他权益</th>
                  <th className="w-[110px] px-5 py-3 font-semibold">日期</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                    <tr key={row.key} className="border-b border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-700 break-words">{row.brand}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900 break-words">{row.model}</td>
                      <td className="px-5 py-4 text-slate-600 break-words leading-relaxed">
                        {pickCategoryText(row, ['price'])}
                      </td>
                      <td className="px-5 py-4 text-slate-600 break-words leading-relaxed">
                        {pickCategoryText(row, ['finance', 'insurance'])}
                      </td>
                      <td className="px-5 py-4 text-slate-600 break-words leading-relaxed">
                        {pickCategoryText(row, ['service'])}
                      </td>
                      <td className="px-5 py-4 text-slate-600 break-words leading-relaxed">
                        {pickCategoryText(row, ['bundle', 'charging', 'trade_in', 'other'])}
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-mono">{row.latestChangeDate || '-'}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-500">
              显示第 {(Math.min(page, totalPages) - 1) * PAGE_SIZE + 1} - {Math.min(Math.min(page, totalPages) * PAGE_SIZE, rows.length)} 行，共 {rows.length} 行
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    type="button"
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`w-9 h-9 rounded-lg border text-sm font-bold ${
                      pageNumber === Math.min(page, totalPages)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
