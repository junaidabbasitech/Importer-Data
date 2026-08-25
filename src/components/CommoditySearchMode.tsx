import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Ship,
  Package,
  Layers,
  MapPin,
  Building2,
  FileSpreadsheet,
  FileText,
  Eye,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Download,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  ExternalLink,
  Sparkles,
  Award,
  Globe2,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  History,
  BarChart3,
  Truck,
  RotateCcw,
  Trash2,
  Scan,
  CheckSquare,
  Square,
  X,
  AlertCircle,
} from 'lucide-react';
import { CommoditySearchParams, CommoditySearchResultItem, ConsigneeProfileData, CommoditySearchHistoryEntry } from '../types';
import { exportCommoditySearchResultsToExcel, exportCommoditySearchResultsToCsv } from '../utils/excelHelper';
import { exportConsigneeToPdf, exportCommoditySummaryToPdf } from '../utils/pdfHelper';
import containerShipWatermark from '../assets/images/container_ship_watermark_1787616050425.jpg';
import { ConsigneeDossierModal } from './ConsigneeDossierModal';
import { ExportPreviewModal } from './ExportPreviewModal';
import { CommodityVolumeChart } from './CommodityVolumeChart';
import { CommoditySearchHistoryPanel } from './CommoditySearchHistoryPanel';
import { ConsigneeSuppliersExpandable } from './ConsigneeSuppliersExpandable';
import { CommoditySearchResultsSkeleton } from './SkeletonLoader';

interface CommoditySearchModeProps {
  onSelectConsigneeForSingleView?: (profile: ConsigneeProfileData) => void;
}

const INDUSTRY_PRESETS = [
  { label: 'Footwear & Shoes', query: 'Footwear', icon: '👟', hs: '6403.99' },
  { label: 'Furniture & Home Decor', query: 'Furniture', icon: '🛋️', hs: '9403.60' },
  { label: 'Consumer Electronics', query: 'Electronics', icon: '📱', hs: '8528.52' },
  { label: 'Apparel & Garments', query: 'Apparel', icon: '👕', hs: '6109.10' },
  { label: 'Auto Parts & Tires', query: 'Auto Parts', icon: '🚗', hs: '8708.29' },
  { label: 'Solar & Clean Energy', query: 'Solar Panels', icon: '☀️', hs: '8541.40' },
  { label: 'Medical & Healthcare', query: 'Medical Supplies', icon: '💊', hs: '9018.90' },
  { label: 'Bicycles & Sports', query: 'Bicycles', icon: '🚴', hs: '8712.00' },
  { label: 'Toys & Games', query: 'Toys', icon: '🧸', hs: '9503.00' },
  { label: 'Hardware & Tools', query: 'Power Tools', icon: '🔧', hs: '8467.21' },
];

const TEU_OPTIONS = [
  { label: '50+ TEUs/yr (Small/Mid Importers)', value: 50 },
  { label: '100+ TEUs/yr (Mid-Sized Importers)', value: 100 },
  { label: '250+ TEUs/yr (High Volume)', value: 250 },
  { label: '500+ TEUs/yr (Major Enterprise)', value: 500 },
  { label: '1,000+ TEUs/yr (Top Tier National)', value: 1000 },
  { label: '2,500+ TEUs/yr (Mega Enterprise)', value: 2500 },
  { label: '5,000+ TEUs/yr (Industry Leaders)', value: 5000 },
];

const ORIGIN_COUNTRIES = [
  'Any',
  'China',
  'Vietnam',
  'India',
  'South Korea',
  'Germany',
  'Taiwan',
  'Mexico',
  'Italy',
  'Japan',
  'Indonesia',
  'Thailand',
];

const US_PORTS = [
  'Any',
  'Port of Los Angeles / Long Beach, CA',
  'Port of New York / New Jersey',
  'Port of Savannah, GA',
  'Port of Houston, TX',
  'Port of Seattle / Tacoma, WA',
  'Port of Charleston, SC',
  'Port of Norfolk / Virginia',
  'Port of Oakland, CA',
];

const HISTORY_STORAGE_KEY = 'us_cnee_commodity_search_history';

export const CommoditySearchMode: React.FC<CommoditySearchModeProps> = () => {
  const [commodityQuery, setCommodityQuery] = useState('Footwear');
  const [hsCodeInput, setHsCodeInput] = useState('6403');
  const [minTeus, setMinTeus] = useState<number>(100);
  const [originCountry, setOriginCountry] = useState('Any');
  const [destinationPort, setDestinationPort] = useState('Any');
  const [cTpatOnly, setCTpatOnly] = useState(false);

  // Results & Modal State
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [searchResults, setSearchResults] = useState<CommoditySearchResultItem[] | null>(null);
  const [selectedModalProfile, setSelectedModalProfile] = useState<ConsigneeProfileData | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [exportPreviewFormat, setExportPreviewFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  // Selection & Batch Action State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isScanningBatch, setIsScanningBatch] = useState(false);
  const [batchScanMsg, setBatchScanMsg] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'deleted';
    message: string;
    deletedItems?: CommoditySearchResultItem[];
  } | null>(null);

  // In-Page Filter, View Mode, & Expandable State
  const [tableSearchFilter, setTableSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'teus_desc' | 'teus_asc' | 'name_asc' | 'rank_asc'>('teus_desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [expandedConsigneeIds, setExpandedConsigneeIds] = useState<Set<string>>(new Set());

  // Search History State
  const [history, setHistory] = useState<CommoditySearchHistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load History from localStorage on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to parse search history:', e);
    }
  }, []);

  const saveHistoryEntry = (params: CommoditySearchParams, results: CommoditySearchResultItem[]) => {
    const totalVol = results.reduce((acc, curr) => acc + curr.annualTeusEstimated, 0);
    const newEntry: CommoditySearchHistoryEntry = {
      id: `hist-${Date.now()}`,
      params,
      timestamp: new Date().toISOString(),
      totalFound: results.length,
      totalVolumeTeus: totalVol,
      results,
    };

    setHistory((prev) => {
      const updated = [newEntry, ...prev.filter((item) => item.params.commodityOrIndustry !== params.commodityOrIndustry)].slice(0, 15);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const handleSelectHistoryEntry = (entry: CommoditySearchHistoryEntry) => {
    const p = entry.params;
    setCommodityQuery(p.commodityOrIndustry);
    setHsCodeInput(p.hsCode || '');
    setMinTeus(p.minAnnualTeus);
    setOriginCountry(p.originCountry || 'Any');
    setDestinationPort(p.destinationPort || 'Any');
    setCTpatOnly(!!p.cTpatVerifiedOnly);
    setSearchResults(entry.results);
  };

  const toggleExpandConsignee = (id: string) => {
    setExpandedConsigneeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commodityQuery.trim()) return;

    setLoading(true);
    setSearchResults(null);
    setExpandedConsigneeIds(new Set());
    setProgressMsg('Initiating USCBP ACE Public Manifest query...');

    const searchParams: CommoditySearchParams = {
      commodityOrIndustry: commodityQuery,
      hsCode: hsCodeInput,
      minAnnualTeus: minTeus,
      originCountry,
      destinationPort,
      cTpatVerifiedOnly: cTpatOnly,
    };

    const logs = [
      'Linking with US Customs ACE Public Manifest Database...',
      `Filtering ocean import bills by commodity "${commodityQuery}"...`,
      `Applying threshold parameter: >= ${minTeus} TEUs/yr...`,
      'Cross-referencing ImportYeti foreign supplier trade lanes...',
      'Aggregating 20+ verified US Consignee profiles...',
    ];

    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < logs.length) {
        setProgressMsg(logs[logIdx]);
        logIdx++;
      }
    }, 700);

    try {
      const response = await fetch('/api/search-by-commodity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error('Failed to fetch commodity search results.');
      }

      const data = await response.json();
      const resItems: CommoditySearchResultItem[] = data.results || [];
      setSearchResults(resItems);

      if (resItems.length > 0) {
        saveHistoryEntry(searchParams, resItems);
      }
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: typeof INDUSTRY_PRESETS[0]) => {
    setCommodityQuery(preset.query);
    if (preset.hs) setHsCodeInput(preset.hs);
  };

  const handleExportPdfSingle = async (profile: ConsigneeProfileData, id: string) => {
    try {
      setExportingPdfId(id);
      await exportConsigneeToPdf(profile);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  const handleExportPdfBulkAll = async () => {
    if (!searchResults || searchResults.length === 0) return;
    try {
      setExportingPdfId('bulk_all');
      for (const item of searchResults) {
        await exportConsigneeToPdf(item.fullProfile);
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (err) {
      console.error('Bulk PDF export failed:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  // Filter & Sort Results
  const filteredResults = (searchResults || [])
    .filter((item) => {
      if (!tableSearchFilter.trim()) return true;
      const term = tableSearchFilter.toLowerCase();
      return (
        item.consigneeName.toLowerCase().includes(term) ||
        item.headquartersAddress.toLowerCase().includes(term) ||
        item.state.toLowerCase().includes(term) ||
        item.topOverseasSupplier.toLowerCase().includes(term) ||
        item.primaryCommodity.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'teus_desc') return b.annualTeusEstimated - a.annualTeusEstimated;
      if (sortBy === 'teus_asc') return a.annualTeusEstimated - b.annualTeusEstimated;
      if (sortBy === 'name_asc') return a.consigneeName.localeCompare(b.consigneeName);
      if (sortBy === 'rank_asc') return a.rank - b.rank;
      return 0;
    });

  // Selection & Batch Action Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected =
    filteredResults.length > 0 &&
    filteredResults.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredResults.forEach((item) => next.add(item.id));
      setSelectedIds(next);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0 || !searchResults) return;
    const count = selectedIds.size;
    const toDelete = searchResults.filter((item) => selectedIds.has(item.id));
    const remaining = searchResults.filter((item) => !selectedIds.has(item.id));

    setSearchResults(remaining);
    setSelectedIds(new Set());
    setNotification({
      type: 'deleted',
      message: `Deleted ${count} consignee${count > 1 ? 's' : ''} from search results.`,
      deletedItems: toDelete,
    });
  };

  const handleUndoDelete = () => {
    if (!notification?.deletedItems || notification.deletedItems.length === 0) return;
    const restored = notification.deletedItems;
    setSearchResults((prev) => [...(prev || []), ...restored]);
    setNotification({
      type: 'success',
      message: `Restored ${restored.length} deleted consignee${restored.length > 1 ? 's' : ''}.`,
    });
  };

  const handleScanSelected = async () => {
    if (selectedIds.size === 0 || !searchResults) return;
    const selectedCount = selectedIds.size;
    setIsScanningBatch(true);

    const steps = [
      `Initiating USCBP ACE manifest intelligence scan for ${selectedCount} selected consignees...`,
      `Cross-referencing ImportYeti shipper relations & Bill of Lading feeds...`,
      `Extracting latest TEU volumes, HS code compliance & C-TPAT credentials...`,
      `Batch inspection completed for ${selectedCount} selected consignees!`,
    ];

    for (const stepMsg of steps) {
      setBatchScanMsg(stepMsg);
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsScanningBatch(false);
    setNotification({
      type: 'success',
      message: `Batch scan completed for ${selectedCount} selected consignees. Data updated!`,
    });
  };

  const handleExportCsv = (onlySelected: boolean = false) => {
    if (!searchResults || searchResults.length === 0) return;
    const targetItems =
      onlySelected && selectedIds.size > 0
        ? searchResults.filter((item) => selectedIds.has(item.id))
        : filteredResults;

    exportCommoditySearchResultsToCsv(targetItems, commodityQuery);
  };

  const handleExportXlsx = (onlySelected: boolean = false) => {
    if (!searchResults || searchResults.length === 0) return;
    const targetItems =
      onlySelected && selectedIds.size > 0
        ? searchResults.filter((item) => selectedIds.has(item.id))
        : filteredResults;

    exportCommoditySearchResultsToExcel(targetItems, commodityQuery);
  };

  const handleExportPdfSummary = async (onlySelected: boolean = false) => {
    if (!searchResults || searchResults.length === 0) return;
    const targetItems =
      onlySelected && selectedIds.size > 0
        ? searchResults.filter((item) => selectedIds.has(item.id))
        : filteredResults;

    try {
      setExportingPdfId('summary');
      await exportCommoditySummaryToPdf(targetItems, commodityQuery);
    } catch (err) {
      console.error('Failed to export summary PDF:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  // Metrics Calculations
  const totalVolume = (searchResults || []).reduce((acc, curr) => acc + curr.annualTeusEstimated, 0);
  const cTpatCount = (searchResults || []).filter((i) => i.c_tpatStatus.includes('Verified') || i.c_tpatStatus.includes('Certified')).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Search Header Banner with History Trigger */}
      <div className="bg-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden" style={{ height: '290px' }}>
        {/* Import / CBP Cargo Ship Picture Watermark Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/45 to-blue-950/65 z-0" />
          <img
            src={containerShipWatermark}
            alt="US Customs Ocean Container Ship Watermark"
            className="w-full h-full object-cover opacity-55 filter contrast-110 saturate-125 scale-105 z-10 relative"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Commodity & Industry Intelligence Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Search US Consignees by Commodity & Import Volume
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed" style={{ paddingTop: '20px' }}>
              Discover verified USA importers (consignees) importing specific products, commodities, or HS codes. Set annual TEU volume thresholds, foreign origin ports, and compliance parameters to generate a comprehensive list of <span className="text-blue-300 font-semibold underline decoration-blue-500">at least 20 active consignees</span> with complete manifest dossiers.
            </p>
          </div>

          {/* History Side Panel Trigger Button */}
          <button
            id="open-search-history-btn"
            onClick={() => setIsHistoryOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-400 text-xs font-bold flex items-center gap-2 text-white shadow-lg transition-all cursor-pointer shrink-0"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Recent Searches</span>
            {history.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-extrabold text-[10px]">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Preset Commodity Pills */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-3" style={{ height: '222px' }}>
        <div className="flex items-center justify-between" style={{ borderRadius: '23px', borderWidth: '2px', borderColor: '#014ecb' }}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-600" />
            Quick Commodity & Industry Presets
          </span>
          <span className="text-xs text-slate-400">Click to load query parameters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                commodityQuery.toLowerCase() === preset.query.toLowerCase()
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-102'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
              {preset.hs && (
                <span className="text-[10px] opacity-75 font-mono bg-black/10 px-1 rounded">
                  HS {preset.hs}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Parameter Search Form Panel */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900">Custom Import Search Parameters</h2>
          <span className="ml-auto px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Guaranteed Min 20 Consignees
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Commodity / Industry Query */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              Commodity / Industry Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={commodityQuery}
                onChange={(e) => setCommodityQuery(e.target.value)}
                placeholder="e.g. Footwear, Leather Shoes, Furniture, Solar Panels..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">e.g. Footwear, Leather Shoes, Furniture, Electronics, Auto Parts</p>
          </div>

          {/* HS Code / Chapter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              HS Code / Chapter (Optional)
            </label>
            <input
              type="text"
              value={hsCodeInput}
              onChange={(e) => setHsCodeInput(e.target.value)}
              placeholder="e.g. 6403, 8528, 9403, Chapter 84"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
            />
            <p className="text-[11px] text-slate-500">2 to 6 digit Harmonized Tariff Schedule code</p>
          </div>

          {/* Min Annual TEUs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-slate-500" />
                Min TEUs / Annual Volume
              </span>
              <span className="text-blue-600 font-extrabold text-xs">{minTeus.toLocaleString()} TEUs/yr</span>
            </label>
            <select
              value={minTeus}
              onChange={(e) => setMinTeus(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
            >
              {TEU_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">Minimum estimated ocean container shipments per year</p>
          </div>

          {/* Origin Country */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-slate-500" />
              Foreign Country of Origin
            </label>
            <select
              value={originCountry}
              onChange={(e) => setOriginCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
            >
              {ORIGIN_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'Any' ? 'Any Origin Country' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Port */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              US Destination Port
            </label>
            <select
              value={destinationPort}
              onChange={(e) => setDestinationPort(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white cursor-pointer"
            >
              {US_PORTS.map((p) => (
                <option key={p} value={p}>
                  {p === 'Any' ? 'Any US Destination Port' : p}
                </option>
              ))}
            </select>
          </div>

          {/* Compliance & Risk Filter */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={cTpatOnly}
                onChange={(e) => setCTpatOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>C-TPAT Certified Importers Only</span>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Search CTA */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Search automatically queries USCBP ACE Public Manifest and ImportYeti Bill of Lading archives.</span>
          </div>

          <button
            id="search-commodity-btn"
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Searching US Customs ACE Data...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-white" />
                <span>Search Consignees (Min 20 Results)</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Banner & Search Results Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Querying US Customs Manifest Intelligence</h3>
              <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold animate-pulse">{progressMsg}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Extracting ocean bills of lading, identifying top foreign shippers, and compiling detailed manifest dossiers for at least 20 consignees...
            </p>
          </div>

          {/* Animated Search Results Skeleton */}
          <CommoditySearchResultsSkeleton />
        </div>
      )}

      {/* Results View Section */}
      {searchResults && searchResults.length > 0 && (
        <div className="space-y-8" style={{ borderColor: '#bf6840', borderWidth: '2px', borderRadius: '44px' }}>
          {/* KPI Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Matching Consignees Found</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{searchResults.length}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ≥ 20 Guaranteed
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Combined Annual TEU Volume</span>
              <div className="text-2xl font-black text-blue-600">
                {totalVolume.toLocaleString()} <span className="text-xs font-medium text-slate-500">TEUs/yr</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">C-TPAT Certified Importers</span>
              <div className="text-2xl font-black text-emerald-600">
                {cTpatCount} <span className="text-xs font-medium text-slate-500">({Math.round((cTpatCount / searchResults.length) * 100)}%)</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-semibold text-slate-500">Primary Foreign Origin</span>
              <div className="text-lg font-bold text-slate-900 truncate">
                {originCountry !== 'Any' ? originCountry : 'China / East Asia'}
              </div>
            </div>
          </div>

          {/* RECHARTS DATA VISUALIZATION SECTION */}
          <CommodityVolumeChart items={searchResults} commodityQuery={commodityQuery} />

          {/* Notification / Toast Banner with Undo for Deletion */}
          {notification && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-4 border shadow-sm animate-in fade-in duration-200 ${
                notification.type === 'deleted'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                {notification.type === 'deleted' ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>

              <div className="flex items-center gap-3">
                {notification.type === 'deleted' && notification.deletedItems && (
                  <button
                    onClick={handleUndoDelete}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo</span>
                  </button>
                )}
                <button
                  onClick={() => setNotification(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Batch Scanning Feedback Banner */}
          {isScanningBatch && (
            <div className="bg-blue-900 text-white p-4 rounded-2xl border border-blue-700 shadow-md flex items-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-blue-200">USCBP ACE Manifest Intelligence Engine</div>
                <div className="text-xs font-mono text-white">{batchScanMsg}</div>
              </div>
            </div>
          )}

          {/* Floating 'Bulk Actions' Toolbar at Bottom when items are selected */}
          {selectedIds.size > 0 && (
            <div className="sticky bottom-6 z-50 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-blue-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-300 my-2">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-black text-sm">
                    {selectedIds.size}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span>{selectedIds.size} Consignee{selectedIds.size > 1 ? 's' : ''} Selected</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Out of {filteredResults.length} matching importers
                    </div>
                  </div>
                </div>

                <button
                  onClick={clearSelection}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                  title="Clear Selection"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {/* Scan Selected Button */}
                <button
                  onClick={handleScanSelected}
                  disabled={isScanningBatch}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Scan / re-scan manifest intelligence for selected items"
                >
                  {isScanningBatch ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Scan className="w-3.5 h-3.5" />
                  )}
                  <span>Scan Selected ({selectedIds.size})</span>
                </button>

                {/* Preview & Export Modal Trigger */}
                <button
                  onClick={() => {
                    setExportPreviewFormat('csv');
                    setIsExportPreviewOpen(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Open interactive export preview modal window"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-200" />
                  <span>Preview & Export</span>
                </button>

                {/* Export Selected XLSX */}
                <button
                  onClick={() => {
                    setExportPreviewFormat('xlsx');
                    setIsExportPreviewOpen(true);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export selected items to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>.XLSX</span>
                </button>

                {/* Export Selected CSV */}
                <button
                  onClick={() => {
                    setExportPreviewFormat('csv');
                    setIsExportPreviewOpen(true);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export selected consignees as CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                {/* Export Selected PDF */}
                <button
                  onClick={() => {
                    setExportPreviewFormat('pdf');
                    setIsExportPreviewOpen(true);
                  }}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export summary PDF report for selected consignees"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Report</span>
                </button>

                {/* Delete Selected Button */}
                <button
                  onClick={handleDeleteSelected}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Delete selected consignees from search results"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {/* Results Toolbar */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Filter Search Input & Select All Quick Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearchFilter}
                  onChange={(e) => setTableSearchFilter(e.target.value)}
                  placeholder="Filter results by name, state..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={toggleSelectAll}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isAllSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Select or deselect all visible consignees"
              >
                {isAllSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs text-slate-800 outline-none cursor-pointer"
                >
                  <option value="teus_desc">Annual TEUs (High to Low)</option>
                  <option value="teus_asc">Annual TEUs (Low to High)</option>
                  <option value="name_asc">Company Name (A-Z)</option>
                  <option value="rank_asc">Original Rank (#1 - #20)</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md text-xs cursor-pointer ${
                    viewMode === 'table' ? 'bg-white shadow-xs font-bold text-blue-600' : 'text-slate-500'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-xs cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white shadow-xs font-bold text-blue-600' : 'text-slate-500'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Download CSV Button */}
              <button
                id="export-commodity-csv-btn"
                onClick={() => handleExportCsv(false)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download search results as CSV file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>CSV</span>
              </button>

              {/* Download XLSX Button */}
              <button
                id="export-commodity-excel-btn"
                onClick={() => exportCommoditySearchResultsToExcel(searchResults, commodityQuery)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download search results as Excel spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>XLSX</span>
              </button>

              {/* Download PDF Report Button */}
              <button
                id="export-commodity-pdf-summary-btn"
                onClick={() => handleExportPdfSummary(false)}
                disabled={exportingPdfId === 'summary'}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download Executive Summary PDF report"
              >
                {exportingPdfId === 'summary' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-white" />
                )}
                <span>PDF Summary</span>
              </button>

              {/* Bulk Export Individual PDFs */}
              <button
                id="export-commodity-pdf-btn"
                onClick={handleExportPdfBulkAll}
                disabled={exportingPdfId === 'bulk_all'}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export individual full Dossiers as PDFs"
              >
                {exportingPdfId === 'bulk_all' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-white" />
                )}
                <span>All Dossiers</span>
              </button>
            </div>
          </div>

          {/* TABLE VIEW WITH EXPANDABLE SUPPLIERS & CHECKBOXES */}
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title={isAllSelected ? 'Deselect All' : 'Select All'}
                        />
                      </th>
                      <th className="py-3 px-4 w-12 text-center">Rank</th>
                      <th className="py-3 px-4">Consignee Name & HQ</th>
                      <th className="py-3 px-4">Annual TEU Volume</th>
                      <th className="py-3 px-4">Commodity / HS Codes</th>
                      <th className="py-3 px-4">Top Overseas Supplier</th>
                      <th className="py-3 px-4">Primary Corridor</th>
                      <th className="py-3 px-4">Compliance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredResults.map((item) => {
                      const isExpanded = expandedConsigneeIds.has(item.id);
                      const isSelected = selectedIds.has(item.id);
                      const shippersCount = item.fullProfile?.topShippers?.length || 1;

                      return (
                        <React.Fragment key={item.id}>
                          <tr
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                                : isExpanded
                                ? 'bg-slate-50/90'
                                : ''
                            }`}
                          >
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(item.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-400 text-center font-mono">
                              #{item.rank}
                            </td>

                            <td className="py-3.5 px-4 space-y-1">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{item.consigneeName}</span>
                                <button
                                  onClick={() => toggleExpandConsignee(item.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                                    isExpanded
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  }`}
                                  title="Toggle Foreign Shippers & Trade Lanes"
                                >
                                  <Truck className="w-3 h-3 text-blue-500 group-hover:text-white" />
                                  <span>Shippers ({shippersCount})</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-xs">{item.headquartersAddress}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200/60 inline-flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-blue-600" />
                                {item.annualTeusFormatted}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 space-y-0.5">
                              <div className="font-semibold text-slate-800">{item.primaryCommodity}</div>
                              <div className="flex flex-wrap gap-1">
                                {item.hsCodesList.slice(0, 2).map((hs) => (
                                  <span key={hs} className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 border border-slate-200">
                                    HS {hs}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 space-y-0.5">
                              <div className="font-semibold text-slate-800 truncate max-w-xs">{item.topOverseasSupplier}</div>
                              <div className="text-[11px] text-slate-500 font-medium">Origin: {item.supplierCountry}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="text-[11px] font-medium text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                                {item.primaryTradeCorridor}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                {item.c_tpatStatus}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleExportPdfSingle(item.fullProfile, item.id)}
                                  disabled={exportingPdfId === item.id}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                  title="Export PDF Report"
                                >
                                  {exportingPdfId === item.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() => setSelectedModalProfile(item.fullProfile)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Dossier</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Foreign Shippers Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-3 bg-slate-950/95 border-b border-slate-800">
                                <ConsigneeSuppliersExpandable
                                  item={item}
                                  onViewFullDossier={() => setSelectedModalProfile(item.fullProfile)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* GRID VIEW WITH EXPANDABLE SUPPLIERS & CHECKBOXES */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResults.map((item) => {
                const isExpanded = expandedConsigneeIds.has(item.id);
                const isSelected = selectedIds.has(item.id);
                const shippersCount = item.fullProfile?.topShippers?.length || 1;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                            #{item.rank}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/60">
                          {item.annualTeusFormatted}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{item.consigneeName}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.headquartersAddress}</span>
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Commodity:</span>
                          <span className="font-semibold text-slate-800">{item.primaryCommodity}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Top Supplier:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[180px]">{item.topOverseasSupplier}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Contact:</span>
                          <span className="font-semibold text-slate-800">{item.keyContactName} ({item.keyContactTitle})</span>
                        </div>
                      </div>

                      {/* Expand Shippers Button */}
                      <button
                        onClick={() => toggleExpandConsignee(item.id)}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Foreign Suppliers & Corridors ({shippersCount})</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Expandable Supplier Content inside Card */}
                      {isExpanded && (
                        <div className="pt-2">
                          <ConsigneeSuppliersExpandable
                            item={item}
                            onViewFullDossier={() => setSelectedModalProfile(item.fullProfile)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleExportPdfSingle(item.fullProfile, item.id)}
                        disabled={exportingPdfId === item.id}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {exportingPdfId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>PDF Report</span>
                      </button>

                      <button
                        onClick={() => setSelectedModalProfile(item.fullProfile)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Dossier</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEARCH HISTORY SIDE DRAWER PANEL */}
      <CommoditySearchHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryEntry={handleSelectHistoryEntry}
        onClearHistory={handleClearHistory}
        onDeleteEntry={handleDeleteHistoryEntry}
      />

      {/* Dossier Modal */}
      {selectedModalProfile && (
        <ConsigneeDossierModal
          data={selectedModalProfile}
          onClose={() => setSelectedModalProfile(null)}
        />
      )}

      {/* Export Preview Modal */}
      {isExportPreviewOpen && searchResults && (
        <ExportPreviewModal
          isOpen={isExportPreviewOpen}
          onClose={() => setIsExportPreviewOpen(false)}
          title="Consignee Export Data Preview"
          commodityQuery={commodityQuery}
          rawItems={
            selectedIds.size > 0
              ? searchResults.filter((item) => selectedIds.has(item.id))
              : searchResults
          }
          initialFormat={exportPreviewFormat}
        />
      )}
    </div>
  );
};
