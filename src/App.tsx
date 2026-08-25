import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SingleConsigneeView } from './components/SingleConsigneeView';
import { CommoditySearchMode } from './components/CommoditySearchMode';
import { BulkUploadView } from './components/BulkUploadView';
import { Watermark } from './components/Watermark';
import { BatchConsigneeItem } from './types';
import { ShieldCheck } from 'lucide-react';

const INITIAL_SAMPLE_BATCH: BatchConsigneeItem[] = [
  {
    id: 'sample-1',
    consigneeName: 'Target Corporation',
    address: '1000 Nicollet Mall, Minneapolis, MN 55403',
    status: 'pending',
  },
  {
    id: 'sample-2',
    consigneeName: 'Williams-Sonoma Inc',
    address: '3250 Van Ness Ave, San Francisco, CA 94109',
    status: 'pending',
  },
  {
    id: 'sample-3',
    consigneeName: 'Trek Bicycle Corporation',
    address: '801 W Madison St, Waterloo, WI 53594',
    status: 'pending',
  },
  {
    id: 'sample-4',
    consigneeName: 'Yeti Coolers LLC',
    address: '7601 Southwest Pkwy, Austin, TX 78735',
    status: 'pending',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'commodity' | 'bulk'>('single');
  const [batchItems, setBatchItems] = useState<BatchConsigneeItem[]>(INITIAL_SAMPLE_BATCH);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('yetiscan_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yetiscan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yetiscan_theme', 'light');
    }
  }, [isDarkMode]);

  const completedCount = batchItems.filter((i) => i.status === 'completed').length;
  const totalBatchCount = batchItems.length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedCount={completedCount}
        totalBatchCount={totalBatchCount}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {activeTab === 'single' ? (
          <SingleConsigneeView />
        ) : activeTab === 'commodity' ? (
          <CommoditySearchMode />
        ) : (
          <BulkUploadView batchItems={batchItems} setBatchItems={setBatchItems} />
        )}
      </main>

      {/* Watermark in bottom right */}
      <Watermark />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 shadow-sm mt-auto">
        <div className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 pb-12 sm:pb-0">
          <div className="flex items-center space-x-3 text-slate-600">
            <span className="flex items-center gap-1.5 font-medium text-slate-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              US Maritime Trade & Customs Intelligence
            </span>
            <span>•</span>
            <span className="text-slate-500">ImportYeti & CBP ACE Manifest Feeds</span>
          </div>

          <div className="text-center sm:text-center text-slate-500">
            Public Ocean Bills of Lading data under 19 U.S.C. § 1431 (US Customs & FOIA)
          </div>
        </div>
      </footer>
    </div>
  );
}

