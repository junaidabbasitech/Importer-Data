import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
  Legend,
} from 'recharts';
import { CommoditySearchResultItem } from '../types';
import { BarChart3, PieChart as PieIcon, Globe2, TrendingUp, Sparkles, Building2, Ship } from 'lucide-react';

interface CommodityVolumeChartProps {
  items: CommoditySearchResultItem[];
  commodityQuery: string;
}

const BAR_COLORS = [
  '#2563eb', '#3b82f6', '#1d4ed8', '#0284c7', '#0369a1',
  '#0d9488', '#059669', '#16a34a', '#65a30d', '#d97706',
  '#ea580c', '#dc2626', '#c026d3', '#9333ea', '#4f46e5',
  '#2563eb', '#3b82f6', '#0284c7', '#0d9488', '#16a34a',
];

export const CommodityVolumeChart: React.FC<CommodityVolumeChartProps> = ({ items, commodityQuery }) => {
  const [activeTab, setActiveTab] = useState<'bar' | 'pie' | 'country'>('bar');

  if (!items || items.length === 0) return null;

  // Prepare top 20 items sorted by TEUs desc
  const sortedItems = [...items].sort((a, b) => b.annualTeusEstimated - a.annualTeusEstimated).slice(0, 20);

  // Data for Bar Chart
  const barData = sortedItems.map((item) => ({
    name: item.consigneeName.length > 22 ? item.consigneeName.slice(0, 20) + '...' : item.consigneeName,
    fullName: item.consigneeName,
    teus: item.annualTeusEstimated,
    formatted: item.annualTeusFormatted,
    state: item.state,
    supplier: item.topOverseasSupplier,
    country: item.supplierCountry,
    rank: item.rank,
  }));

  // Data for Market Share Pie Chart (Top 5 vs Next 15 vs Others)
  const top5Total = sortedItems.slice(0, 5).reduce((sum, i) => sum + i.annualTeusEstimated, 0);
  const next15Total = sortedItems.slice(5, 20).reduce((sum, i) => sum + i.annualTeusEstimated, 0);
  const grandTotal = items.reduce((sum, i) => sum + i.annualTeusEstimated, 0);
  const remainingTotal = Math.max(0, grandTotal - (top5Total + next15Total));

  const pieData = [
    { name: 'Top 5 Importers', value: top5Total, color: '#1d4ed8' },
    { name: 'Ranks #6 - #20 Importers', value: next15Total, color: '#0284c7' },
    ...(remainingTotal > 0 ? [{ name: 'Other Importers in Category', value: remainingTotal, color: '#94a3b8' }] : []),
  ];

  // Data for Country Breakdown Chart
  const countryMap: Record<string, number> = {};
  items.forEach((item) => {
    const c = item.supplierCountry || 'East Asia';
    countryMap[c] = (countryMap[c] || 0) + item.annualTeusEstimated;
  });

  const countryData = Object.entries(countryMap)
    .map(([country, teus]) => ({ country, teus }))
    .sort((a, b) => b.teus - a.teus);

  // Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 max-w-xs backdrop-blur-md">
          <div className="font-bold text-sm text-blue-300 flex items-center justify-between gap-2">
            <span>{data.fullName}</span>
            <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded font-mono">
              #{data.rank}
            </span>
          </div>
          <div className="text-slate-300 flex items-center gap-1.5 font-semibold text-xs pt-1 border-t border-slate-800">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Volume: <strong className="text-white font-extrabold">{data.teus.toLocaleString()} TEUs/yr</strong></span>
          </div>
          <div className="text-slate-400 text-[11px]">
            HQ State: <span className="text-slate-200 font-medium">{data.state}</span>
          </div>
          <div className="text-slate-400 text-[11px] truncate">
            Top Supplier: <span className="text-slate-200 font-medium">{data.supplier} ({data.country})</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Chart Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Market Intelligence Analytics</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            TEU Volume Distribution — {commodityQuery} Importers
          </h3>
          <p className="text-xs text-slate-500">
            Comparing top 20 US consignees by estimated annual ocean container import volume (TEUs)
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bar'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Top 20 TEUs</span>
          </button>

          <button
            onClick={() => setActiveTab('pie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pie'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Market Share</span>
          </button>

          <button
            onClick={() => setActiveTab('country')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'country'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Origin Breakdown</span>
          </button>
        </div>
      </div>

      {/* CHART CONTENT AREA */}
      <div className="pt-2">
        {activeTab === 'bar' && (
          <div className="space-y-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 15, right: 10, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `${val.toLocaleString()}`}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="teus" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-slate-400 italic">
              Hover over bars to inspect detailed TEU volume, headquarters state, and top foreign supplier partner.
            </p>
          </div>
        )}

        {activeTab === 'pie' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} TEUs`, 'Annual Volume']}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200/80">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Market Concentration Metrics
              </h4>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                  <span className="font-medium text-slate-600">Top 5 Importers Volume:</span>
                  <span className="font-extrabold text-blue-700">
                    {top5Total.toLocaleString()} TEUs ({Math.round((top5Total / grandTotal) * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                  <span className="font-medium text-slate-600">Next 15 (#6 - #20) Volume:</span>
                  <span className="font-extrabold text-sky-700">
                    {next15Total.toLocaleString()} TEUs ({Math.round((next15Total / grandTotal) * 100)}%)
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-white border border-slate-200">
                  <span className="font-medium text-slate-600">Total Analyzed Volume:</span>
                  <span className="font-extrabold text-slate-900">
                    {grandTotal.toLocaleString()} TEUs / year
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'country' && (
          <div className="space-y-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `${v.toLocaleString()}`} />
                  <YAxis dataKey="country" type="category" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} TEUs`, 'Import Volume']} />
                  <Bar dataKey="teus" fill="#0d9488" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-slate-400 italic">
              Distribution of ocean import container volume categorized by foreign country of origin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
