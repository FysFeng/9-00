import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { getRadarData } from '../../../utils/dashboardHelpers';
import { NewsItem } from '../../../types';

interface CompetitorRadarProps {
    brandA: string;
    brandB: string;
    onBrandAChange: (brand: string) => void;
    onBrandBChange: (brand: string) => void;
    availableBrands: string[];
    news: NewsItem[];
}

// Dimension metadata — explains each axis in plain language
const DIMENSION_INFO: Record<string, { label: string; tip: string }> = {
    '新车发布': {
        label: '新车发布',
        tip: '该品牌近期发布/预告新车型的资讯数量。数值越高，说明硬件攻势越强。'
    },
    '销量数据': {
        label: '销量数据',
        tip: '该品牌近期出现销量相关报道的频率。反映市场关注度与实际销售表现。'
    },
    '价格/促销': {
        label: '价格/促销',
        tip: '价格调整、促销活动、限时优惠等资讯数量。数值高表示正在发动价格战。'
    },
    '售后/渠道': {
        label: '售后/渠道',
        tip: '经销商扩张、服务网络升级、用户留存等资讯数量。反映长期渠道建设投入。'
    },
    '企业动态': {
        label: '企业动态',
        tip: '战略合作、融资、品牌重塑等企业层面动作。数值高说明品牌正在布局未来。'
    },
};

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const subject = payload[0]?.payload?.subject;
        return (
            <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-[200px]">
                <p className="font-bold text-slate-800 mb-1">{subject}</p>
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                        <span className="text-slate-600">{entry.name}：</span>
                        <span className="font-bold text-slate-800">{entry.value} 条</span>
                    </div>
                ))}
                {subject && DIMENSION_INFO[subject] && (
                    <p className="text-slate-400 mt-2 leading-relaxed border-t border-slate-100 pt-2">
                        {DIMENSION_INFO[subject].tip}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// Custom axis tick with hover explanation
const CustomAxisTick = ({ x, y, payload }: any) => {
    const [hovered, setHovered] = useState(false);
    const info = DIMENSION_INFO[payload.value];

    return (
        <g>
            <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="cursor-help"
                fill={hovered ? '#2563eb' : '#475569'}
                fontSize={11}
                fontWeight={600}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {payload.value}
                {info && (
                    <tspan fill="#94a3b8" fontSize={9}> ⓘ</tspan>
                )}
            </text>
        </g>
    );
};

export default function CompetitorRadar({
    brandA,
    brandB,
    onBrandAChange,
    onBrandBChange,
    availableBrands,
    news
}: CompetitorRadarProps) {
    const radarData = React.useMemo(() => getRadarData(brandA, brandB, news), [brandA, brandB, news]);

    const totalA = news.filter(n => n.brand === brandA).length;
    const totalB = news.filter(n => n.brand === brandB).length;

    const isChanganA = brandA.includes("Changan") || brandA.includes("长安");
    const isChanganB = brandB.includes("Changan") || brandB.includes("长安");

    const colorA = isChanganA ? "#2563eb" : "#64748b";
    const fillA = isChanganA ? "#3b82f6" : "#cbd5e1";
    const colorB = isChanganB ? "#2563eb" : "#dc2626";
    const fillB = isChanganB ? "#3b82f6" : "#ef4444";

    return (
        <div className="flex flex-col h-full">

            {/* Brand selectors */}
            <div className="flex gap-3 mb-4 justify-center bg-slate-50 p-2 rounded-lg border border-slate-100 w-max mx-auto">
                <select
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded px-2 py-1.5 outline-none shadow-sm min-w-[120px]"
                    value={brandA}
                    onChange={e => onBrandAChange(e.target.value)}
                >
                    {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <span className="text-slate-300 font-black italic self-center">VS</span>
                <select
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded px-2 py-1.5 outline-none shadow-sm min-w-[120px]"
                    value={brandB}
                    onChange={e => onBrandBChange(e.target.value)}
                >
                    {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            {/* Chart — explicit px height avoids Recharts -1 bug when parent is flex */}
            <div style={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={<CustomAxisTick />}
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name={brandA} dataKey="A" stroke={colorA} strokeWidth={2.5} fill={fillA} fillOpacity={0.18} />
                        <Radar name={brandB} dataKey="B" stroke={colorB} strokeWidth={2.5} fill={fillB} fillOpacity={0.18} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#475569' }} />
                        <RechartsTooltip content={<CustomTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* Data source note */}
            <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                    <span className="font-bold text-slate-500">数据来源：</span>
                    系统已录入资讯计算。
                    {brandA}共 <span className="font-bold text-blue-600">{totalA}</span> 条，
                    {brandB}共 <span className="font-bold text-red-500">{totalB}</span> 条。
                    <br />
                    各维度数值 = 该类型资讯数量，数值越高代表近期动作越频繁。
                    <span className="ml-1 text-blue-400 cursor-help" title="Hover on each axis label to see what it means">ⓘ 悬停坐标轴可查看维度说明</span>
                </p>
            </div>
        </div>
    );
}
