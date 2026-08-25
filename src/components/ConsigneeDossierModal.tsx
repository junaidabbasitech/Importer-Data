import React, { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { ConsigneeProfileData } from '../types';
import { ConsigneeDossierCard } from './ConsigneeDossierCard';

interface ConsigneeDossierModalProps {
  data: ConsigneeProfileData | null;
  onClose: () => void;
}

export const ConsigneeDossierModal: React.FC<ConsigneeDossierModalProps> = ({
  data,
  onClose,
}) => {
  useEffect(() => {
    if (!data) return;

    // Prevent underlying page scrolling while modal is open
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
  }, [data, onClose]);

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 flex justify-center items-start animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-[1600px] my-2 sm:my-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Sticky Top Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 truncate">
              Consignee Trade Dossier — {data.consigneeName}
            </h3>
          </div>
          <button
            id="close-dossier-modal-btn"
            onClick={onClose}
            className="p-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
            aria-label="Close modal"
          >
            <span className="hidden sm:inline">Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Dossier Card Area */}
        <div className="overflow-y-auto flex-1">
          <ConsigneeDossierCard data={data} onClose={onClose} isModal={true} />
        </div>
      </div>
    </div>
  );
};
