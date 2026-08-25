import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Download,
  Printer,
  CheckSquare,
  Square,
  ShieldCheck,
  Building2,
  Trash2,
  SlidersHorizontal,
  Table as TableIcon,
} from 'lucide-react';
import { CommoditySearchResultItem, BatchConsigneeItem } from '../types';
import { exportCommoditySearchResultsToCsv, exportCommoditySearchResultsToExcel, exportConsigneesToCsv, exportConsigneesToExcel } from '../utils/excelHelper';
import { exportCommoditySummaryToPdf, exportConsigneeToPdf } from '../utils/pdfHelper';

export interface ExportPreviewItem {
  id: string;
  rank?: number;
  consigneeName: string;
  address: string;
  annualTeus: string | number;
  annualTeusNum: number;
  primaryCommodity: string;
  topSupplier: string;
  primaryCorridor: string;
  compliance: string;
  fullProfile?: any;
}

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  commodityQuery?: string;
  rawItems: (CommoditySearchResultItem | BatchConsigneeItem)[];
  initialFormat?: 'xlsx' | 'csv' | 'pdf';
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  title = 'Export Data Preview',
  commodityQuery = 'Consignee Import Intelligence',
  rawItems,
  initialFormat = 'csv',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv' | 'pdf'>(initialFormat);
  const [itemsToExport, setItemsToExport] = useState<ExportPreviewItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  // Column visibilities
  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    consignee: true,
    address: true,
    teus: true,
    commodity: true,
    supplier: true,
    corridor: true,
    compliance: true,
  });

  // Sync formatted items on open or rawItems change
  React.useEffect(() => {
    if (!isOpen) return;

    const formatted: ExportPreviewItem[] = rawItems.map((item, index) => {
      // Check if item is CommoditySearchResultItem
      if ('consigneeName' in item && 'annualTeusFormatted' in item) {
        const cItem = item as CommoditySearchResultItem;
        return {
          id: cItem.id,
          rank: cItem.rank || index + 1,
          consigneeName: cItem.consigneeName,
          address: cItem.headquartersAddress || cItem.state || 'United States',
          annualTeus: cItem.annualTeusFormatted,
          annualTeusNum: cItem.annualTeusEstimated || 0,
          primaryCommodity: cItem.primaryCommodity || 'General Inbound Cargo',
          topSupplier: cItem.topOverseasSupplier || 'Multinational Supplier',
          primaryCorridor: cItem.primaryTradeCorridor || 'Asia ➔ US West Coast',
          compliance: cItem.c_tpatStatus || 'C-TPAT Tier II',
          fullProfile: cItem.fullProfile,
        };
      } else {
        // BatchConsigneeItem
        const bItem = item as BatchConsigneeItem;
        const p = bItem.profile;
        return {
          id: bItem.id,
          rank: index + 1,
          consigneeName: bItem.consigneeName,
          address: bItem.address || p?.addressVerified || 'United States',
          annualTeus: p?.shipmentMetrics?.annualShipmentsEstimated || '100+ TEUs',
          annualTeusNum: parseInt(p?.shipmentMetrics?.annualShipmentsEstimated?.replace(/[^0-9]/g, '') || '100', 10),
          primaryCommodity: p?.commodities?.[0]?.description || 'Commercial Freight',
          topSupplier: p?.topShippers?.[0]?.shipperName || 'Foreign Manufacturer',
          primaryCorridor: p?.tradeLanes?.[0]?.usDestinationPort ? `Origin ➔ ${p.tradeLanes[0].usDestinationPort}` : 'Global Ocean Corridor',
          compliance: p?.complianceAndRisk?.c_tpatStatus || 'Verified Importer',
          fullProfile: p,
        };
      }
    });

    setItemsToExport(formatted);
    setSelectedIds(new Set(formatted.map((i) => i.id)));
  }, [isOpen, rawItems]);

  if (!isOpen) return null;

  const activeItems = itemsToExport.filter((item) => selectedIds.has(item.id));
  const totalTeus = activeItems.reduce((acc, curr) => acc + (curr.annualTeusNum || 0), 0);

  const toggleSelectAll = () => {
    if (selectedIds.size === itemsToExport.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itemsToExport.map((i) => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeItemFromPreview = (id: string) => {
    setItemsToExport((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleTriggerExport = async () => {
    if (activeItems.length === 0) {
      alert('Please select at least one consignee row to export.');
      return;
    }

    setIsGenerating(true);
    try {
      if (selectedFormat === 'csv') {
        // Map activeItems back to search result format or direct CSV
        const csvItems: CommoditySearchResultItem[] = activeItems.map((item) => ({
          id: item.id,
          rank: item.rank || 1,
          consigneeName: item.consigneeName,
          headquartersAddress: item.address,
          city: '',
          state: '',
          annualTeusEstimated: item.annualTeusNum,
          annualTeusFormatted: item.annualTeus.toString(),
          topOverseasSupplier: item.topSupplier,
          primaryTradeCorridor: item.primaryCorridor,
          c_tpatStatus: item.compliance,
          primaryCommodity: item.primaryCommodity,
          hsCodes: [],
          fullProfile: item.fullProfile,
        }));
        exportCommoditySearchResultsToCsv(csvItems, commodityQuery);
      } else if (selectedFormat === 'xlsx') {
        const xlsxItems: CommoditySearchResultItem[] = activeItems.map((item) => ({
          id: item.id,
          rank: item.rank || 1,
          consigneeName: item.consigneeName,
          headquartersAddress: item.address,
          city: '',
          state: '',
          annualTeusEstimated: item.annualTeusNum,
          annualTeusFormatted: item.annualTeus.toString(),
          topOverseasSupplier: item.topSupplier,
          primaryTradeCorridor: item.primaryCorridor,
          c_tpatStatus: item.compliance,
          primaryCommodity: item.primaryCommodity,
          hsCodes: [],
          fullProfile: item.fullProfile,
        }));
        exportCommoditySearchResultsToExcel(xlsxItems, commodityQuery);
      } else if (selectedFormat === 'pdf') {
        const pdfItems: CommoditySearchResultItem[] = activeItems.map((item) => ({
          id: item.id,
          rank: item.rank || 1,
          consigneeName: item.consigneeName,
          headquartersAddress: item.address,
          city: '',
          state: '',
          annualTeusEstimated: item.annualTeusNum,
          annualTeusFormatted: item.annualTeus.toString(),
          topOverseasSupplier: item.topSupplier,
          primaryTradeCorridor: item.primaryCorridor,
          c_tpatStatus: item.compliance,
          primaryCommodity: item.primaryCommodity,
          hsCodes: [],
          fullProfile: item.fullProfile,
        }));
        await exportCommoditySummaryToPdf(pdfItems, commodityQuery);
      }
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPreviewTable = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 flex justify-center items-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl my-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Sticky Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {activeItems.length} Selected
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review, filter, and customize columns before downloading your report.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Configuration Controls */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
          {/* Format Selector Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Export Format:
            </span>
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFormat === 'csv'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV (.csv)</span>
            </button>

            <button
              onClick={() => setSelectedFormat('xlsx')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFormat === 'xlsx'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => setSelectedFormat('pdf')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFormat === 'pdf'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Summary (.pdf)</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 mr-1">Est. TEU Volume:</span>
              <span className="font-extrabold text-blue-400">{totalTeus.toLocaleString()} TEUs</span>
            </div>
            <button
              onClick={handlePrintPreviewTable}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* Scrollable Formatted Data Table */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="font-semibold text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {selectedIds.size === itemsToExport.length ? (
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Select / Deselect All ({itemsToExport.length})</span>
              </button>
            </div>
            <span>Showing {activeItems.length} of {itemsToExport.length} consignees queued</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3.5 w-10 text-center">Select</th>
                  <th className="px-3 py-3.5 w-12 text-center">Rank</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Consignee Name</th>
                  <th className="px-4 py-3.5 min-w-[160px]">Address / HQ</th>
                  <th className="px-4 py-3.5 min-w-[120px]">Annual TEUs</th>
                  <th className="px-4 py-3.5 min-w-[180px]">Primary Commodity</th>
                  <th className="px-4 py-3.5 min-w-[160px]">Top Overseas Supplier</th>
                  <th className="px-4 py-3.5 min-w-[160px]">Primary Corridor</th>
                  <th className="px-3 py-3.5 w-12 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-medium">
                {itemsToExport.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-900/80 transition-colors ${
                        isSelected ? 'bg-slate-900/40 text-slate-100' : 'opacity-50 bg-slate-950/90 text-slate-400'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.id)}
                          className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-400 text-center">
                        #{item.rank}
                      </td>
                      <td className="px-4 py-3 font-bold text-white">
                        {item.consigneeName}
                      </td>
                      <td className="px-4 py-3 text-slate-300 truncate max-w-[180px]">
                        {item.address}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">
                        {item.annualTeus}
                      </td>
                      <td className="px-4 py-3 text-slate-300 truncate max-w-[200px]">
                        {item.primaryCommodity}
                      </td>
                      <td className="px-4 py-3 text-slate-300 truncate max-w-[180px]">
                        {item.topSupplier}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-medium truncate max-w-[180px]">
                        {item.primaryCorridor}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => removeItemFromPreview(item.id)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove from export preview"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Selected: <span className="font-bold text-white">{activeItems.length}</span> consignees
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleTriggerExport}
              disabled={isGenerating || activeItems.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-xl flex items-center gap-2 transition-all cursor-pointer ${
                selectedFormat === 'csv'
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  : selectedFormat === 'xlsx'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'Generating Report...'
                  : `Confirm & Download (${selectedFormat.toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
