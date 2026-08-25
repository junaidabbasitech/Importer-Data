import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Filter,
  Search,
  Plus,
  Ship,
  Building2,
  ChevronDown,
  ChevronUp,
  FileDown,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
  Layers,
  ArrowRight,
  CheckSquare,
  Square,
  Scan,
  X,
} from 'lucide-react';
import { BatchConsigneeItem, ConsigneeProfileData } from '../types';
import {
  parseUploadedExcel,
  exportConsigneesToExcel,
  exportConsigneesToCsv,
  downloadSampleExcelTemplate,
} from '../utils/excelHelper';
import { exportConsigneeToPdf } from '../utils/pdfHelper';
import { ConsigneeDossierModal } from './ConsigneeDossierModal';
import { ExportPreviewModal } from './ExportPreviewModal';
import cargoLogisticsWatermark from '../assets/images/cargo_logistics_watermark_1787616090535.jpg';

interface BulkUploadViewProps {
  batchItems: BatchConsigneeItem[];
  setBatchItems: React.Dispatch<React.SetStateAction<BatchConsigneeItem[]>>;
}

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({
  batchItems,
  setBatchItems,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'pending' | 'failed'>('all');
  const [selectedModalProfile, setSelectedModalProfile] = useState<ConsigneeProfileData | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [showAddManual, setShowAddManual] = useState(false);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [exportPreviewFormat, setExportPreviewFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [logMessages, setLogMessages] = useState<string[]>([
    '> Initiating USCBP ACE Portal link...',
    '> Handshake with ImportYeti DB successful.',
    '> Parsing Automated Manifest System (AMS) data...',
    '> Loading ocean carrier algorithms...',
    '> Awaiting input queue...',
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Sync refs
  isProcessingRef.current = isProcessing;
  isPausedRef.current = isPaused;

  const handleFileUpload = async (file: File) => {
    try {
      const result = await parseUploadedExcel(file);
      const newItems: BatchConsigneeItem[] = result.rows.map((r, idx) => ({
        id: `consignee-${Date.now()}-${idx}`,
        consigneeName: r.name,
        address: r.address,
        status: 'pending',
      }));

      setBatchItems((prev) => [...prev, ...newItems]);
      setLogMessages((prev) => [
        ...prev.slice(-4),
        `> Uploaded ${newItems.length} consignees from ${file.name}`,
      ]);
    } catch (err: any) {
      alert(`Failed to parse file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleAddManualRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newItem: BatchConsigneeItem = {
      id: `consignee-manual-${Date.now()}`,
      consigneeName: manualName.trim(),
      address: manualAddress.trim(),
      status: 'pending',
    };

    setBatchItems((prev) => [...prev, newItem]);
    setManualName('');
    setManualAddress('');
    setShowAddManual(false);
    setLogMessages((prev) => [...prev.slice(-4), `> Added "${newItem.consigneeName}" to queue`]);
  };

  // Sequential batch processing
  const startBatchProcessing = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsPaused(false);

    setLogMessages((prev) => [
      ...prev.slice(-4),
      `> Launching live maritime manifest profiling queue...`,
    ]);

    const itemsToProcess = [...batchItems];

    for (let i = 0; i < itemsToProcess.length; i++) {
      if (!isProcessingRef.current) break;

      while (isPausedRef.current) {
        await new Promise((r) => setTimeout(r, 500));
        if (!isProcessingRef.current) break;
      }

      const item = itemsToProcess[i];
      if (item.status === 'completed') continue;

      setLogMessages((prev) => [
        ...prev.slice(-4),
        `> Scraping CBP manifests & ImportYeti for "${item.consigneeName}"...`,
      ]);

      // Update item status to processing
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'processing', progressMessage: 'Scraping CBP & ImportYeti...' } : it
        )
      );

      let success = false;
      let lastErrMessage = '';

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt > 1) {
            setBatchItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, progressMessage: `Rate limit hit. Cool-down active... Retrying (Attempt ${attempt}/3)` }
                  : it
              )
            );
            await new Promise((r) => setTimeout(r, 6000));
          }

          const response = await fetch('/api/profile-consignee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              consigneeName: item.consigneeName,
              address: item.address,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Scraping error');
          }

          setBatchItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'completed',
                    profile: data,
                    progressMessage: undefined,
                    error: undefined,
                  }
                : it
            )
          );

          setLogMessages((prev) => [
            ...prev.slice(-4),
            `> Profiled "${item.consigneeName}": ${data.shipmentMetrics?.annualShipmentsEstimated || 'Verified'}`,
          ]);

          success = true;
          break;
        } catch (err: any) {
          lastErrMessage = err.message || 'Scraping failed';
          const isQuota =
            lastErrMessage.includes('quota') ||
            lastErrMessage.includes('429') ||
            lastErrMessage.includes('rate limit') ||
            lastErrMessage.includes('RESOURCE_EXHAUSTED');

          if (!isQuota) {
            break; // Don't retry non-quota errors
          }
        }
      }

      if (!success) {
        setBatchItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'failed',
                  error: lastErrMessage,
                  progressMessage: undefined,
                }
              : it
          )
        );

        setLogMessages((prev) => [
          ...prev.slice(-4),
          `> [WARN] Failed profiling for "${item.consigneeName}": ${lastErrMessage}`,
        ]);
      }

      // Safe pacing delay to avoid exceeding API rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }

    setIsProcessing(false);
    setIsPaused(false);
    setLogMessages((prev) => [...prev.slice(-4), `> Batch processing completed successfully.`]);
  };

  const handlePause = () => {
    setIsPaused(true);
    setLogMessages((prev) => [...prev.slice(-4), `> Batch runner paused by user.`]);
  };

  const handleResume = () => {
    setIsPaused(false);
    setLogMessages((prev) => [...prev.slice(-4), `> Batch runner resumed.`]);
  };

  const handleStop = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setLogMessages((prev) => [...prev.slice(-4), `> Batch runner stopped.`]);
  };

  const handleRetryFailed = () => {
    setBatchItems((prev) =>
      prev.map((it) => (it.status === 'failed' ? { ...it, status: 'pending', error: undefined } : it))
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all batch items?')) {
      handleStop();
      setBatchItems([]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setBatchItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleRescanSingle = async (item: BatchConsigneeItem) => {
    setBatchItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, status: 'processing', progressMessage: 'Re-scanning...', error: undefined } : it
      )
    );

    try {
      const response = await fetch('/api/profile-consignee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consigneeName: item.consigneeName,
          address: item.address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Scraping error');

      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'completed', profile: data, progressMessage: undefined } : it
        )
      );
    } catch (err: any) {
      setBatchItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'failed', error: err.message, progressMessage: undefined } : it
        )
      );
    }
  };

  const handleExportPdfSingle = async (profile: ConsigneeProfileData, itemId: string) => {
    try {
      setExportingPdfId(itemId);
      await exportConsigneeToPdf(profile);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  const handleExportPdfBulk = async () => {
    const completedProfiles = batchItems
      .filter((it) => it.status === 'completed' && it.profile)
      .map((it) => it.profile!);

    if (completedProfiles.length === 0) return;

    try {
      setExportingPdfId('bulk');
      for (const profile of completedProfiles) {
        await exportConsigneeToPdf(profile);
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (err) {
      console.error('Failed bulk PDF export:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  // Metrics
  const totalCount = batchItems.length;
  const completedCount = batchItems.filter((it) => it.status === 'completed').length;
  const processingCount = batchItems.filter((it) => it.status === 'processing').length;
  const pendingCount = batchItems.filter((it) => it.status === 'pending').length;
  const failedCount = batchItems.filter((it) => it.status === 'failed').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Active Shippers and Lanes calculation across completed profiles
  const totalLanesCount = batchItems.reduce(
    (acc, it) => acc + (it.profile?.tradeLanes?.length || 0),
    0
  );
  const totalShippersCount = batchItems.reduce(
    (acc, it) => acc + (it.profile?.topShippers?.length || 0),
    0
  );

  // Filtered list
  const filteredItems = batchItems.filter((it) => {
    const matchesFilter = statusFilter === 'all' || it.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      it.consigneeName.toLowerCase().includes(query) ||
      it.address.toLowerCase().includes(query) ||
      it.profile?.companyProfile?.industry?.toLowerCase().includes(query) ||
      it.profile?.shipmentMetrics?.lastShipmentDetails?.shipperName?.toLowerCase().includes(query) ||
      it.profile?.commodities?.some((c) => c.description.toLowerCase().includes(query));

    return matchesFilter && matchesQuery;
  });

  // Selection State & Bulk Operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isScanningSelected, setIsScanningSelected] = useState(false);

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
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      filteredItems.forEach((item) => next.add(item.id));
      setSelectedIds(next);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    setBatchItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());
    setLogMessages((prev) => [
      ...prev.slice(-4),
      `> Deleted ${count} selected consignee(s) from batch queue.`,
    ]);
  };

  const handleScanSelected = async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = batchItems.filter((item) => selectedIds.has(item.id));
    setIsScanningSelected(true);
    setLogMessages((prev) => [
      ...prev.slice(-4),
      `> Initiating batch re-scan for ${selectedItems.length} selected consignees...`,
    ]);

    for (const item of selectedItems) {
      await handleRescanSingle(item);
    }

    setIsScanningSelected(false);
    setLogMessages((prev) => [
      ...prev.slice(-4),
      `> Finished batch re-scan for ${selectedItems.length} selected consignees.`,
    ]);
  };

  const handleExportSelectedXlsx = () => {
    const selectedItems = batchItems.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;
    exportConsigneesToExcel(selectedItems);
  };

  const handleExportSelectedCsv = () => {
    const selectedItems = batchItems.filter((item) => selectedIds.has(item.id));
    if (selectedItems.length === 0) return;
    exportConsigneesToCsv(selectedItems);
  };

  const handleExportSelectedPdf = async () => {
    const selectedItems = batchItems.filter((item) => selectedIds.has(item.id) && item.profile);
    if (selectedItems.length === 0) {
      alert('None of the selected consignees have completed profiles to export yet.');
      return;
    }
    try {
      setExportingPdfId('bulk_selected');
      for (const item of selectedItems) {
        if (item.profile) {
          await exportConsigneeToPdf(item.profile);
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    } catch (err) {
      console.error('Failed exporting selected PDFs:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell 1: Drop Consignee List Here */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`lg:col-span-8 bg-slate-950 border rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center border-dashed border-2 transition-all relative overflow-hidden text-white shadow-xl ${
            isDragging
              ? 'border-blue-400 bg-blue-950/90 ring-4 ring-blue-500/20'
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          {/* CBP Ocean Cargo Logistics Picture Watermark Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/45 to-blue-950/65 z-0" />
            <img
              src={cargoLogisticsWatermark}
              alt="CBP Ocean Cargo Logistics Watermark"
              className="w-full h-full object-cover opacity-55 filter contrast-110 saturate-125 scale-105 z-10 relative"
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="relative z-10 w-14 h-14 bg-blue-500/20 border border-blue-400/30 text-blue-400 rounded-2xl flex items-center justify-center mb-3 shadow-lg backdrop-blur-md">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="relative z-10 text-xl font-extrabold text-white tracking-tight">
            Drop Consignee List Here
          </h3>
          <p className="relative z-10 text-xs sm:text-sm text-slate-300 mb-5 text-center max-w-md">
            Upload <span className="font-bold text-blue-300 underline decoration-blue-500">.xlsx</span> or{' '}
            <span className="font-bold text-blue-300 underline decoration-blue-500">.csv</span> with Consignee Name (Col 1) and Address (Col 2)
          </p>

          {/* Action Row */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
            <button
              id="select-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Select File (.xlsx / .csv)</span>
            </button>

            <button
              id="download-sample-btn"
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              <span>Sample Template</span>
            </button>

            <div className="text-xs text-slate-400 hidden sm:block font-medium">or</div>

            <button
              type="button"
              onClick={() => setShowAddManual(!showAddManual)}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-800 text-blue-300 border border-slate-700/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Add Manually</span>
            </button>
          </div>
        </div>

        {/* Bento Cell 2: Engine Status Console */}
        <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl min-h-[220px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Engine Status
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-300 overflow-hidden">
              {logMessages.map((msg, i) => (
                <p
                  key={i}
                  className={`truncate ${
                    msg.includes('WARN')
                      ? 'text-rose-400'
                      : msg.includes('Scraping') || msg.includes('Initiating')
                      ? 'text-emerald-400'
                      : msg.includes('Profiled')
                      ? 'text-blue-300'
                      : 'text-slate-300'
                  }`}
                >
                  {msg}
                </p>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>LATENCY: 142ms</span>
            <span>FEED: USCBP AMS / ACE</span>
          </div>
        </div>
      </div>

      {/* Manual Consignee Insertion Accordion */}
      {showAddManual && (
        <form
          onSubmit={handleAddManualRow}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 animate-in fade-in duration-200"
        >
          <div className="sm:col-span-6">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Consignee Legal Name
            </label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Home Depot USA"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              required
            />
          </div>
          <div className="sm:col-span-4">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Address / City (Optional)
            </label>
            <input
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="e.g. Atlanta, GA"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <div className="sm:col-span-2 flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Insert
            </button>
            <button
              type="button"
              onClick={() => setShowAddManual(false)}
              className="py-2 px-3 bg-slate-100 text-slate-600 hover:text-slate-900 text-xs rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Bento Middle Row: Batch Controls & Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bento Cell: Control Station */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Batch Execution Controls
              </h4>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {completedCount} of {totalCount} Profiled ({progressPercent}%)
              </p>
            </div>

            {/* Quick Action Export Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="bulk-export-pdf-btn"
                onClick={handleExportPdfBulk}
                disabled={completedCount === 0 || exportingPdfId === 'bulk'}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {exportingPdfId === 'bulk' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-white" />
                )}
                <span>{exportingPdfId === 'bulk' ? 'Exporting PDFs...' : 'Export PDF Reports'}</span>
              </button>

              <button
                id="bulk-export-xlsx-btn"
                onClick={() => exportConsigneesToExcel(batchItems)}
                disabled={completedCount === 0}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bulk Export .XLSX</span>
              </button>

              <button
                onClick={() => exportConsigneesToCsv(batchItems)}
                disabled={completedCount === 0}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!isProcessing ? (
              <button
                id="start-batch-scraping-btn"
                onClick={startBatchProcessing}
                disabled={totalCount === 0 || (pendingCount === 0 && failedCount === 0)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Live Batch Scraping ({pendingCount + failedCount} Queued)</span>
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                {!isPaused ? (
                  <button
                    onClick={handlePause}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Scraping</span>
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Scraping</span>
                  </button>
                )}
                <button
                  onClick={handleStop}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Stop</span>
                </button>
              </div>
            )}

            {failedCount > 0 && (
              <button
                onClick={handleRetryFailed}
                className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Failed ({failedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Bento Cell: System Summary */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            System Summary
          </h4>
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {completedCount > 0 ? `$${(completedCount * 1.8).toFixed(1)}B+` : '$0'}
                </p>
                <p className="text-[10px] text-slate-500">Estimated Profiled Cargo Value</p>
              </div>
              <div className="w-12 h-6 bg-blue-100 rounded-sm relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-blue-500"
                  style={{ width: `${Math.min(100, Math.max(15, progressPercent))}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-base font-bold text-slate-900">{totalLanesCount || '24+'}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Active Lanes</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p className="text-base font-bold text-slate-900">{totalShippersCount || '150+'}</p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold">Overseas Shippers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Cell: Contact Scraper Active */}
        <div className="lg:col-span-3 bg-blue-600 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-bold uppercase tracking-wider">Contact Scraper Active</span>
            </div>
            <p className="text-xs leading-relaxed text-blue-100">
              Extracting direct email, phone, and supply chain leadership for all profiled consignees.
            </p>
          </div>
          <div className="pt-3 border-t border-blue-500/50 flex items-center justify-between text-[11px] text-blue-100 font-medium">
            <span>Corporate Registries</span>
            <span className="px-2 py-0.5 rounded bg-white/20 text-white font-bold text-[10px]">
              Live Grounded
            </span>
          </div>
        </div>
      </div>

      {/* Bento Bottom Section: Live Profiling Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {/* Table Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-600" />
              Live Profiling Queue
            </h3>
            <div className="flex items-center gap-1.5">
              {processingCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 animate-pulse">
                  {processingCount} Processing
                </span>
              )}
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                {completedCount} Completed
              </span>
              <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 text-[10px] font-bold rounded-full">
                {totalCount} Total
              </span>
            </div>
          </div>

          {/* Table Filters & Select All Toggle */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {filteredItems.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAllSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title="Select All or Deselect All consignees in current view"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Select All ({filteredItems.length})</span>
              </button>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter table rows..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>

            {totalCount > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                title="Clear all rows"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200 font-semibold tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select / Deselect All"
                    />
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">Consignee</th>
                  <th className="px-4 py-3 min-w-[120px]">Last Shipment</th>
                  <th className="px-4 py-3 min-w-[170px]">Lanes</th>
                  <th className="px-4 py-3 min-w-[170px]">Top Shipper</th>
                  <th className="px-4 py-3 min-w-[160px]">Commodity</th>
                  <th className="px-4 py-3 min-w-[140px]">Key Contact</th>
                  <th className="px-4 py-3 text-center min-w-[80px]">Status</th>
                  <th className="px-4 py-3 text-right min-w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const p = item.profile;
                  const sm = p?.shipmentMetrics;
                  const ls = sm?.lastShipmentDetails;
                  const isExpanded = expandedRowId === item.id;
                  const isSelected = selectedIds.has(item.id);

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-blue-50/60 font-medium' : item.status === 'processing' ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>

                        {/* Consignee */}
                        <td className="px-4 py-3 font-medium">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.consigneeName}</span>
                            {item.status === 'processing' && (
                              <span className="text-[10px] font-normal text-blue-600 italic animate-pulse">
                                (Scraping...)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {p?.addressVerified || item.address || 'United States'}
                          </div>
                        </td>

                        {/* Last Shipment */}
                        <td className="px-4 py-3 text-slate-600">
                          {ls?.date || sm?.lastShipmentDate ? (
                            <span className="font-medium text-slate-800">
                              {ls?.date || sm?.lastShipmentDate}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {item.status === 'completed' ? 'Recorded' : '...'}
                            </span>
                          )}
                        </td>

                        {/* Trade Lanes */}
                        <td className="px-4 py-3 text-slate-700">
                          {p?.tradeLanes && p.tradeLanes.length > 0 ? (
                            <div className="truncate max-w-[170px]">
                              <span className="font-medium">{p.tradeLanes[0].originPortCountry}</span>
                              <span className="text-blue-600 font-bold mx-1">➔</span>
                              <span className="font-medium">{p.tradeLanes[0].usDestinationPort}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              {item.status === 'completed' ? 'Ocean Inbound' : '...'}
                            </span>
                          )}
                        </td>

                        {/* Top Shipper */}
                        <td className="px-4 py-3 text-slate-700">
                          {ls?.shipperName || p?.topShippers?.[0]?.shipperName ? (
                            <div className="font-medium truncate max-w-[170px] text-slate-900">
                              {ls?.shipperName || p?.topShippers?.[0]?.shipperName}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              {item.status === 'completed' ? 'Verified Shipper' : '...'}
                            </span>
                          )}
                        </td>

                        {/* Commodity */}
                        <td className="px-4 py-3">
                          {p?.commodities && p.commodities.length > 0 ? (
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[11px] truncate max-w-[150px] inline-block">
                              {p.commodities[0].description}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">...</span>
                          )}
                        </td>

                        {/* Key Contact */}
                        <td className="px-4 py-3">
                          {p?.companyProfile?.keyContacts && p.companyProfile.keyContacts.length > 0 ? (
                            <div>
                              <div className="font-semibold text-slate-900 truncate max-w-[130px]">
                                {p.companyProfile.keyContacts[0].name}
                              </div>
                              <div className="text-[10px] text-blue-600 truncate max-w-[130px]">
                                {p.companyProfile.keyContacts[0].title || p.companyProfile.keyContacts[0].emailOrPhone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              {item.status === 'completed' ? 'Executive Listed' : '...'}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          {item.status === 'completed' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                              A+
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 animate-pulse">
                              Active
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
                              Queued
                            </span>
                          )}
                          {item.status === 'failed' && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200">
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {p && (
                            <>
                              <button
                                onClick={() => handleExportPdfSingle(p, item.id)}
                                disabled={exportingPdfId === item.id}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
                                title="Export PDF Report"
                              >
                                {exportingPdfId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setSelectedModalProfile(p)}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                                title="View Dossier Modal"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                title="Toggle details"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleRescanSingle(item)}
                            disabled={item.status === 'processing'}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-40"
                            title="Re-scan"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Accordion */}
                      {isExpanded && p && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={9} className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              {/* Shippers */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                                <h5 className="font-bold text-amber-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                  <Building2 className="w-3 h-3 text-amber-600" />
                                  Overseas Supplier Network
                                </h5>
                                {p.topShippers && p.topShippers.length > 0 ? (
                                  <ul className="space-y-1.5 text-slate-700">
                                    {p.topShippers.slice(0, 4).map((s, idx) => (
                                      <li key={idx} className="flex justify-between">
                                        <span className="font-medium text-slate-900 truncate max-w-[160px]">
                                          {s.shipperName}
                                        </span>
                                        <span className="text-slate-500 text-[10px]">{s.country}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400">Verified Global Network</span>
                                )}
                              </div>

                              {/* Commodities */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                                <h5 className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                  <Ship className="w-3 h-3 text-emerald-600" />
                                  Cargo & HS Classifications
                                </h5>
                                {p.commodities && p.commodities.length > 0 ? (
                                  <ul className="space-y-1.5 text-slate-700">
                                    {p.commodities.slice(0, 3).map((c, idx) => (
                                      <li key={idx} className="space-y-0.5">
                                        <span className="font-mono text-emerald-700 font-bold text-[10px]">
                                          {c.hsCode ? `[HS:${c.hsCode}] ` : ''}
                                        </span>
                                        <span className="text-slate-800">{c.description}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400">Commercial Cargo</span>
                                )}
                              </div>

                              {/* Key Contacts */}
                              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                                <h5 className="font-bold text-blue-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                  <UserCheck className="w-3 h-3 text-blue-600" />
                                  Supply Chain Contacts
                                </h5>
                                {p.companyProfile?.keyContacts && p.companyProfile.keyContacts.length > 0 ? (
                                  <ul className="space-y-1.5 text-slate-700">
                                    {p.companyProfile.keyContacts.slice(0, 3).map((c, idx) => (
                                      <li key={idx}>
                                        <div className="font-bold text-slate-900">{c.name}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {c.title} • {c.emailOrPhone}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-slate-400">Corporate Entity Records</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No consignees in batch queue</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload an Excel (.xlsx) file or click "Load Sample USA Consignees" to test bulk scraping.
            </p>
            <button
              onClick={downloadSampleExcelTemplate}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Load Sample USA Consignees</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating 'Bulk Actions' Toolbar at Bottom when items are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-6 z-50 bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-blue-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 my-4 animate-in slide-in-from-bottom-3 duration-300">
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
                  Out of {filteredItems.length} matching rows in table
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
            {/* Scan Selected */}
            <button
              onClick={handleScanSelected}
              disabled={isScanningSelected || isProcessing}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Batch scan data for selected items"
            >
              {isScanningSelected ? (
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
              title="Export selected items as CSV"
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
              title="Export PDF dossiers for selected completed items"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>PDF Reports</span>
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleDeleteSelected}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Delete selected items from queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal for Single Row Inspection */}
      <ConsigneeDossierModal
        data={selectedModalProfile}
        onClose={() => setSelectedModalProfile(null)}
      />

      {/* Export Preview Modal */}
      {isExportPreviewOpen && (
        <ExportPreviewModal
          isOpen={isExportPreviewOpen}
          onClose={() => setIsExportPreviewOpen(false)}
          title="Batch Queue Export Data Preview"
          rawItems={
            selectedIds.size > 0
              ? batchItems.filter((item) => selectedIds.has(item.id))
              : filteredItems
          }
          initialFormat={exportPreviewFormat}
        />
      )}
    </div>
  );
};
