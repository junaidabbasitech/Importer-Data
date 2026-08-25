import React from 'react';
import { Anchor, Database, FileSpreadsheet, ShieldCheck, Search, Package, Sparkles, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: 'single' | 'commodity' | 'bulk';
  setActiveTab: (tab: 'single' | 'commodity' | 'bulk') => void;
  completedCount: number;
  totalBatchCount: number;
  isDarkMode: boolean;
  setIsDarkMode: (darkMode: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  completedCount,
  totalBatchCount,
  isDarkMode,
  setIsDarkMode,
}) => {
  return (
    <header className="h-16 sm:h-18 border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs backdrop-blur-md">
      <div className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full gap-2">
          {/* Logo & Brand (Clickable to open Consignee Dossier page) */}
          <button
            onClick={() => setActiveTab('single')}
            className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl p-1 transition-all shrink-0"
            title="Open Consignee Dossier"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 group-hover:bg-blue-700 group-hover:scale-105 rounded-lg flex items-center justify-center shadow-xs transition-all shrink-0">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="font-bold text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                YetiScan<span className="text-blue-600">AI</span>
              </span>
              <div className="hidden md:inline-flex ml-3 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded border border-emerald-200 items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                CBP Authorized API
              </div>
            </div>
          </button>

          {/* Bento Segmented Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              id="tab-single-search"
              onClick={() => setActiveTab('single')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'single'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50'
              }`}
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Consignee Dossier</span>
            </button>

            <button
              id="tab-commodity-search"
              onClick={() => setActiveTab('commodity')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'commodity'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50'
              }`}
            >
              <Package className="w-4 h-4 text-purple-600" />
              <span>Commodity / TEU Search</span>
              <span className="hidden xl:inline-block px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded-full">
                20+ CNEEs
              </span>
            </button>

            <button
              id="tab-bulk-excel"
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-150 cursor-pointer whitespace-nowrap ${
                activeTab === 'bulk'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Bulk Excel</span>
              {totalBatchCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  {completedCount}/{totalBatchCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Status Badge & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all text-xs font-bold cursor-pointer shadow-xs"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live USCBP AMS Linked</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


