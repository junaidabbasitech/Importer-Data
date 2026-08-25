import React from 'react';
import { CommoditySearchResultItem } from '../types';
import {
  Factory,
  Globe2,
  Ship,
  FileCheck,
  TrendingUp,
  Package,
  MapPin,
  ExternalLink,
  ChevronUp,
  Building,
  Anchor,
} from 'lucide-react';

interface ConsigneeSuppliersExpandableProps {
  item: CommoditySearchResultItem;
  onViewFullDossier: () => void;
}

export const ConsigneeSuppliersExpandable: React.FC<ConsigneeSuppliersExpandableProps> = ({
  item,
  onViewFullDossier,
}) => {
  const profile = item.fullProfile;
  const shippers = profile?.topShippers || [];
  const tradeLanes = profile?.tradeLanes || [];
  const lastShipment = profile?.shipmentMetrics?.lastShipmentDetails;

  return (
    <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-inner my-2 animate-in fade-in duration-200">
      {/* Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-400">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Primary Foreign Suppliers & Factory Partners</span>
              <span className="text-[10px] font-mono bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                {shippers.length} Verified Partners
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Verified overseas exporters and trade corridors for <strong className="text-slate-200">{item.consigneeName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onViewFullDossier}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer self-start sm:self-auto"
        >
          <span>Open Complete Manifest Dossier</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Shippers Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {shippers.map((shipper, idx) => (
          <div
            key={idx}
            className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2 hover:border-slate-600 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-blue-300 truncate font-sans">
                {shipper.shipperName}
              </span>
              {shipper.shipmentShareOrCount && (
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded shrink-0">
                  {shipper.shipmentShareOrCount}
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Globe2 className="w-3 h-3 text-blue-400" />
                <span>Origin: <strong className="text-slate-200">{shipper.country}</strong></span>
              </div>
              {shipper.primaryGoods && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Package className="w-3 h-3 text-emerald-400" />
                  <span className="truncate">Goods: <strong className="text-slate-200">{shipper.primaryGoods}</strong></span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trade Lanes & Last Bill of Lading Detail */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Active Trade Lanes */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5 text-blue-400" />
            Verified Ocean Corridors
          </span>
          <div className="space-y-1">
            {tradeLanes.map((lane, lIdx) => (
              <div key={lIdx} className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 flex items-center justify-between">
                <span className="text-slate-200 font-medium">{lane.originPortCountry}</span>
                <span className="text-blue-400 font-bold">➔</span>
                <span className="text-slate-200 font-medium">{lane.usDestinationPort}</span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded text-slate-300">
                  {lane.transportMode || 'Ocean'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Last BoL Manifest Highlight */}
        {lastShipment && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Last Recorded Manifest Entry
            </span>
            <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Master BoL ID:</span>
                <span className="font-mono font-bold text-emerald-300">{lastShipment.masterBillOfLadingOrManifest || 'ACE-Verified'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Carrier & Route:</span>
                <span className="text-slate-200 font-medium">{lastShipment.carrier || 'Ocean Line'} ({lastShipment.originPort} ➔ {lastShipment.destinationPort})</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Cargo Description:</span>
                <span className="text-slate-200 font-medium truncate max-w-[200px]">{lastShipment.commodityDescription}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
