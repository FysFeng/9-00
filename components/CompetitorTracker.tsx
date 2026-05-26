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

const isMetaBrand = (brand: string) => brand.includes('政策相关') || brand.startsWith('Other');

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
        brand: item.brand,
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
        <div className="flex items-center justify-between gap-4">
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
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="px-5 py-3 font-semibold">日期</th>
              <th className="px-5 py-3 font-semibold">动作类型</th>
              <th className="px-5 py-3 font-semibold">变化前</th>
              <th className="px-5 py-3 font-semibold">变化后</th>
              <th className="px-5 py-3 font-semibold">指导价</th>
              <th className="px-5 py-3 font-semibold">说明</th>
              <th className="px-5 py-3 font-semibold">来源</th>
            </tr>
          </thead>
          <tbody>
            {row.allRecords.map((record) => (
              <tr key={record.id} className="border-b border-slate-100 align-top">
                <td className="px-5 py-4 text-slate-500 font-mono">{record.date}</td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900">{CATEGORY_LABELS[record.category]}</div>
                  <div className="text-slate-500 mt-1">{record.action}</div>
                </td>
                <td className="px-5 py-4 text-slate-600">{record.previousValue || '-'}</td>
                <td className="px-5 py-4 text-slate-600">{record.currentValue || '-'}</td>
                <td className="px-5 py-4 text-slate-600">{record.msrp ? `${record.currency} ${record.msrp}` : '-'}</td>
                <td className="px-5 py-4 text-slate-600">
                  {record.note || record.rawExcerpt || '-'}
                </td>
                <td className="px-5 py-4 text-slate-600">
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

  const brandOptions = useMemo(
    () =>
      Array.from(new Set(rawIntelligence.map((item) => item.brand)))
        .filter((brand) => brand && !isMetaBrand(brand))
        .sort((a, b) => a.localeCompare(b)),
    [rawIntelligence],
  );

  const [selectedBrand, setSelectedBrand] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [lookbackDays, setLookbackDays] = useState(90);
  const [selectedKey, setSelectedKey] = useState('');

  useEffect(() => {
    if (!selectedBrand && brandOptions.length > 0) {
      setSelectedBrand(brandOptions[0]);
    }
  }, [brandOptions, selectedBrand]);

  const cutoffDate = useMemo(() => {
    const current = new Date();
    current.setDate(current.getDate() - lookbackDays);
    return current.toISOString().split('T')[0];
  }, [lookbackDays]);

  const keyword = useMemo(() => normalizeText(keywordInput), [keywordInput]);

  const signalRecords = useMemo(() => {
    const scoped = rawIntelligence.filter((item) => item.brand === selectedBrand);
    return buildSignalRecords(scoped, cutoffDate).filter((record) => matchesKeyword(record, keyword));
  }, [rawIntelligence, selectedBrand, cutoffDate, keyword]);

  const rows = useMemo(() => buildTrackerRows(signalRecords), [signalRecords]);

  useEffect(() => {
    if (!rows.length) {
      setSelectedKey('');
      return;
    }
    if (!selectedKey || !rows.some((row) => row.key === selectedKey)) {
      setSelectedKey(rows[0].key);
    }
  }, [rows, selectedKey]);

  const selectedRow = rows.find((row) => row.key === selectedKey) || null;

  return (
    <div className="p-8 lg:p-10 max-w-[1500px] mx-auto animate-fadeIn">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide">
            Strategy Board
          </span>
          <span className="text-xs text-slate-500">不是新闻流，而是按车型聚合后的策略台账</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">竞品价格与策略追踪表</h1>
        <p className="mt-2 text-sm text-slate-500">
          每一行代表一个品牌车型组合。你先看总表，再点开看变化明细，不需要一条一条读新闻。
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
            >
              {brandOptions.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
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
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">车型策略总表</h2>
            <p className="text-sm text-slate-500 mt-1">先看每个车型最近的价格、金融、保险、置换、服务和其他策略。</p>
          </div>
          <span className="text-xs text-slate-400">共 {rows.length} 个车型</span>
        </div>

        {rows.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            当前筛选下还没有可展示的结构化策略记录。后面接好采集后，这里会逐步长出表格数据。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white">
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-5 py-3 font-semibold">品牌</th>
                  <th className="px-5 py-3 font-semibold">车型</th>
                  <th className="px-5 py-3 font-semibold">指导价</th>
                  {PRIMARY_COLUMNS.map((category) => (
                    <th key={category} className="px-5 py-3 font-semibold">{CATEGORY_LABELS[category]}</th>
                  ))}
                  <th className="px-5 py-3 font-semibold">最近变化</th>
                  <th className="px-5 py-3 font-semibold">记录数</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isActive = row.key === selectedKey;
                  return (
                    <tr
                      key={row.key}
                      onClick={() => setSelectedKey(row.key)}
                      className={`border-b border-slate-100 cursor-pointer transition-colors ${isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                    >
                      <td className="px-5 py-4 font-medium text-slate-700">{row.brand}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{row.model}</td>
                      <td className="px-5 py-4 text-slate-600">{row.msrp ? `${row.currency} ${row.msrp}` : '-'}</td>
                      {PRIMARY_COLUMNS.map((category) => (
                        <td key={category} className="px-5 py-4 text-slate-600 min-w-[180px]">
                          {formatSignalCell(row.latestByCategory[category])}
                        </td>
                      ))}
                      <td className="px-5 py-4 text-slate-500 font-mono">{row.latestChangeDate || '-'}</td>
                      <td className="px-5 py-4 text-slate-500">{row.recordsCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRow && (
        <DetailTable row={selectedRow} />
      )}
    </div>
  );
}
