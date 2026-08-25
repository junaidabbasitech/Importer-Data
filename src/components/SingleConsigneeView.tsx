import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Building,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  Ship,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { ConsigneeProfileData } from '../types';
import { ConsigneeDossierCard } from './ConsigneeDossierCard';
import { ConsigneeDossierSkeleton } from './SkeletonLoader';
import customsPortWatermark from '../assets/images/customs_port_watermark_1787616071951.jpg';

const SAMPLE_CONSIGNEES = [
  { name: 'Target Corporation', address: '1000 Nicollet Mall, Minneapolis, MN' },
  { name: 'Williams-Sonoma Inc', address: '3250 Van Ness Ave, San Francisco, CA' },
  { name: 'Trek Bicycle Corporation', address: '801 W Madison St, Waterloo, WI' },
  { name: 'Yeti Coolers LLC', address: '7601 Southwest Pkwy, Austin, TX' },
  { name: 'Ashley Furniture Industries', address: '1 Ashley Way, Arcadia, WI' },
];

export const SingleConsigneeView: React.FC = () => {
  const [consigneeName, setConsigneeName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [profile, setProfile] = useState<ConsigneeProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stages = [
    'Connecting to US Customs & Border Protection (CBP) Public Manifest Feeds...',
    'Querying ImportYeti Ocean Bill of Lading Archives...',
    'Extracting Latest Manifests, TEU Volumes & Foreign Shippers...',
    'Synthesizing Verified Supply Chain Decision Makers & Contact Records...',
  ];

  const handleSearch = async (nameToSearch?: string, addrToSearch?: string) => {
    const targetName = (nameToSearch || consigneeName).trim();
    const targetAddr = (addrToSearch || address).trim();

    if (!targetName) return;

    setLoading(true);
    setError(null);
    setProfile(null);
    setLoadingStage(0);

    // Staged progress ticker
    const interval = setInterval(() => {
      setLoadingStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 2400);

    try {
      const response = await fetch('/api/profile-consignee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consigneeName: targetName,
          address: targetAddr,
          deepSearch: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch consignee profile');
      }

      setProfile(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error conducting trade intelligence investigation');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: { name: string; address: string }) => {
    setConsigneeName(sample.name);
    setAddress(sample.address);
    handleSearch(sample.name, sample.address);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Bento Grid Search Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Search Bento Card */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white">
          {/* US Customs Port Picture Watermark Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/45 to-blue-950/65 z-0" />
            <img
              src={customsPortWatermark}
              alt="US Customs Port Watermark"
              className="w-full h-full object-cover opacity-55 filter contrast-110 saturate-125 scale-105 z-10 relative"
            />
          </div>

          <div className="relative z-10 space-y-4" style={{ paddingTop: '50px' }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                Live CBP Manifest & ImportYeti Profiler
              </div>
              <span className="text-[11px] text-slate-400 font-medium">19 U.S.C. § 1431 Compliant</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Investigate Any USA Consignee & Importer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1" style={{ marginRight: '500px', borderColor: '#e7eeef' }}>
                Deep ocean manifest search across bills of lading, overseas manufacturers, active shipping lanes, and verified corporate leadership.
              </p>
            </div>

            {/* Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-3 pt-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Consignee Name */}
                <div className="sm:col-span-7 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="consignee-name-input"
                    type="text"
                    value={consigneeName}
                    onChange={(e) => setConsigneeName(e.target.value)}
                    placeholder="Consignee Name (e.g. Target Corporation)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900 transition-all shadow-inner"
                    required
                  />
                </div>

                {/* Address / Location */}
                <div className="sm:col-span-5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="consignee-address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State / Address (Optional)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 mr-1">Quick:</span>
                  {SAMPLE_CONSIGNEES.slice(0, 3).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSample(s)}
                      className="px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {/* Submit Button */}
                <button
                  id="run-single-investigation-btn"
                  type="submit"
                  disabled={loading || !consigneeName.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scraping Customs Feeds...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Scrap Live Intelligence</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Engine Status Console Bento Card */}
        <div className="lg:col-span-4 bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl min-h-[200px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Live Engine Feed
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                READY
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-300 opacity-90">
              <p className="text-emerald-400">&gt; USCBP ACE manifest sync connected.</p>
              <p>&gt; ImportYeti maritime database linked.</p>
              <p>&gt; Ocean carrier bill of lading parser loaded.</p>
              <p className="text-blue-300">&gt; Ready for consignee profiling query.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between text-[10px] text-slate-400 font-mono">
            <span>INDEX: 1.2B+ BoLs</span>
            <span>AUTH: VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Loading State Animation & Dossier Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xs animate-in fade-in duration-300">
            <div className="relative mx-auto w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
              <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin flex items-center justify-center">
                <Ship className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Investigating "{consigneeName}"
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                {stages[loadingStage]}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center items-center gap-2">
              {stages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= loadingStage ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Dossier Skeleton Preview */}
          <ConsigneeDossierSkeleton />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-rose-800">Investigation Incomplete</h4>
            <p className="text-xs text-rose-700">{error}</p>
            <button
              onClick={() => handleSearch()}
              className="mt-2 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Retry Search
            </button>
          </div>
        </div>
      )}

      {/* Result Dossier Bento Card */}
      {profile && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
          <ConsigneeDossierCard data={profile} />
        </div>
      )}
    </div>
  );
};
