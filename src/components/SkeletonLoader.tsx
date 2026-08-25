import React from 'react';

// Basic Pulse Skeleton Line
export const SkeletonLine: React.FC<{
  className?: string;
  width?: string;
  height?: string;
}> = ({ className = '', width = 'w-full', height = 'h-4' }) => (
  <div
    className={`bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse ${width} ${height} ${className}`}
  />
);

// Basic Pulse Skeleton Block/Box
export const SkeletonBlock: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div
    className={`bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse ${className}`}
  />
);

// 1. CONSIGNEE DOSSIER SKELETON
export const ConsigneeDossierSkeleton: React.FC<{ isModal?: boolean }> = ({ isModal = false }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 animate-in fade-in duration-300">
      {/* Top Banner Skeleton */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-36 bg-blue-500/20 border border-blue-500/30 rounded-md animate-pulse" />
              <div className="h-6 w-28 bg-slate-800 rounded-md animate-pulse" />
              <div className="h-6 w-24 bg-emerald-500/20 rounded-md animate-pulse" />
            </div>

            {/* Title & Address */}
            <div className="space-y-2">
              <div className="h-8 w-2/3 bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-4 w-1/2 bg-slate-800/80 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-9 w-28 bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-9 w-28 bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-9 w-24 bg-blue-600/40 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* KPI 4-Card Metric Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-4 bg-slate-800 rounded-full animate-pulse" />
              </div>
              <div className="h-7 w-28 bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-3 w-32 bg-slate-800/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs Skeleton */}
      <div className="border-b border-slate-800 bg-slate-950/95 px-6 py-3 flex space-x-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-28 bg-slate-800 rounded-lg animate-pulse shrink-0" />
        ))}
      </div>

      {/* Main Tab Content Skeleton */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-slate-800 rounded-md animate-pulse" />
                <div className="h-4 w-16 bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-800/70 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-800/70 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-slate-800/70 rounded animate-pulse" />
              </div>

              {/* Progress bars skeleton */}
              <div className="space-y-3 pt-3">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <div className="h-3.5 w-32 bg-slate-800 rounded animate-pulse" />
                      <div className="h-3.5 w-12 bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-40 bg-slate-800 rounded-md animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="space-y-1.5">
                      <div className="h-4 w-28 bg-slate-800 rounded animate-pulse" />
                      <div className="h-3 w-36 bg-slate-800/60 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-16 bg-blue-500/20 rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. COMMODITY SEARCH RESULTS SKELETON
export const CommoditySearchResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Stats Banner Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="flex items-baseline gap-2">
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-4 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
            <div className="h-3.5 w-72 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse" />
          </div>
          <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>

        {/* Simulated Bar Chart Skeleton */}
        <div className="h-56 w-full pt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {[40, 65, 80, 50, 90, 70, 85, 60, 45, 75, 95, 55].map((heightPct, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-lg animate-pulse transition-all"
                style={{ height: `${heightPct}%` }}
              />
              <div className="h-3 w-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Results Toolbar Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="h-9 w-full md:w-72 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="h-9 w-40 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table Rows / Cards Skeleton List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {[1, 2, 3, 4, 5, 6, 7].map((rowIdx) => (
            <div key={rowIdx} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                    <div className="h-4 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse" />
                  </div>
                  <div className="h-3.5 w-64 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse" />
                  <div className="flex items-center gap-4 pt-1">
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="space-y-1 text-right">
                  <div className="h-5 w-20 bg-blue-100 dark:bg-blue-900/40 rounded-md animate-pulse ml-auto" />
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
                <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
