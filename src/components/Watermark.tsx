import React, { useState } from 'react';
import { Sparkles, Code2, ShieldCheck, Terminal, Heart, ExternalLink, Zap, Layers, User } from 'lucide-react';

export const Watermark: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 group font-sans"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* HOVER MENU / CARD POPOVER */}
      <div
        className={`absolute bottom-full right-0 mb-3 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-white transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-95 pointer-events-none translate-y-2'
        }`}
      >
        {/* Top Header Card */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-blue-400 font-extrabold text-sm">
              JA
            </div>
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>JUNAID ABBASI</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-[11px] text-blue-400 font-medium">Lead AI & Trade Systems Architect</p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="py-3 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>USCBP ACE Maritime Trade Engine</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Real-time ImportYeti & Bill of Lading Analytics</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>19 U.S.C. § 1431 Compliant Profiler</span>
          </div>
        </div>

        {/* Tech Stack Pills */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">React 18</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">TypeScript</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Recharts</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">Tailwind CSS</span>
        </div>

        {/* Footer Note */}
        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for Global Trade
          </span>
          <span className="text-slate-500">v2.5 Pro</span>
        </div>
      </div>

      {/* FLOATING WATERMARK BADGE */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative group/btn flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-950 border border-slate-700/80 hover:border-blue-400/80 text-white shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer backdrop-blur-md"
      >
        {/* Animated glowing backplate */}
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-30 group-hover/btn:opacity-100 blur-xs transition-all duration-300 -z-10"></span>

        <Code2 className="w-4 h-4 text-blue-400 group-hover/btn:text-emerald-400 transition-colors" />

        <div className="text-xs font-bold tracking-wide flex items-center gap-1">
          <span className="text-slate-400 font-normal text-[11px]">Powered By</span>
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 group-hover/btn:from-emerald-300 group-hover/btn:via-blue-300 group-hover/btn:to-purple-300 bg-clip-text text-transparent font-black">
            JUNAID ABBASI
          </span>
        </div>

        <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover/btn:scale-125 transition-transform"></span>
      </button>
    </div>
  );
};
