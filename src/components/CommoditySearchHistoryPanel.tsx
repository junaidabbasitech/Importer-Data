import React, { useState } from 'react';
import { CommoditySearchHistoryEntry } from '../types';
import {
  History,
  Clock,
  Search,
  Trash2,
  X,
  Package,
  Layers,
  Ship,
  MapPin,
  Globe2,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface CommoditySearchHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: CommoditySearchHistoryEntry[];
  onSelectHistoryEntry: (entry: CommoditySearchHistoryEntry) => void;
  onClearHistory: () => void;
  onDeleteEntry: (id: string) => void;
}

export const CommoditySearchHistoryPanel: React.FC<CommoditySearchHistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryEntry,
  onClearHistory,
  onDeleteEntry,
}) => {
  const [filterText, setFilterText] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredHistory = history.filter((entry) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const p = entry.params;
    return (
      p.commodityOrIndustry.toLowerCase().includes(q) ||
      (p.hsCode && p.hsCode.toLowerCase().includes(q)) ||
      (p.originCountry && p.originCountry.toLowerCase().includes(q)) ||
      (p.destinationPort && p.destinationPort.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Commodity Search History</h3>
                <p className="text-xs text-slate-300">Past import searches & saved insights</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Filter Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter saved queries..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear All History"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700">No Search History Found</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Executed commodity & industry searches will be automatically saved here for quick instant access.
                  </p>
                </div>
              </div>
            ) : (
              filteredHistory.map((entry) => {
                const p = entry.params;
                const formattedDate = new Date(entry.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={entry.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {p.commodityOrIndustry}
                          </span>
                          {p.hsCode && (
                            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.2 rounded font-bold text-slate-600 border border-slate-200">
                              HS {p.hsCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry(entry.id);
                        }}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete this entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Parameter Tags */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200/60 inline-flex items-center gap-1">
                        <Ship className="w-3 h-3" />
                        ≥ {p.minAnnualTeus} TEUs/yr
                      </span>
                      {p.originCountry && p.originCountry !== 'Any' && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          Origin: {p.originCountry}
                        </span>
                      )}
                      {p.destinationPort && p.destinationPort !== 'Any' && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          Port: {p.destinationPort}
                        </span>
                      )}
                    </div>

                    {/* Stats Summary */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-slate-600">
                        <strong className="text-slate-900">{entry.totalFound}</strong> Consignees Found ({entry.totalVolumeTeus.toLocaleString()} TEUs)
                      </div>

                      <button
                        onClick={() => {
                          onSelectHistoryEntry(entry);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Load Results</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 text-center">
            Saved locally in browser storage. Click &quot;Load Results&quot; to restore parameters and manifest dossiers instantly.
          </div>
        </div>
      </div>
    </div>
  );
};
