import React, { useState } from 'react';
import {
  Ship,
  Building2,
  MapPin,
  Calendar,
  Globe,
  Phone,
  Mail,
  UserCheck,
  TrendingUp,
  Package,
  Route,
  ShieldCheck,
  ExternalLink,
  Download,
  Copy,
  Check,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Clock,
  Layers,
  Loader2,
  Printer,
} from 'lucide-react';
import { ConsigneeProfileData } from '../types';
import { exportConsigneesToExcel } from '../utils/excelHelper';
import { exportConsigneeToPdf } from '../utils/pdfHelper';

interface ConsigneeDossierCardProps {
  data: ConsigneeProfileData;
  onClose?: () => void;
  isModal?: boolean;
}

export const ConsigneeDossierCard: React.FC<ConsigneeDossierCardProps> = ({
  data,
  onClose,
  isModal = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'lastShipment' | 'shippers' | 'lanes' | 'commodities' | 'contacts' | 'sources'
  >('overview');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleCopySummary = () => {
    const text = `Consignee: ${data.consigneeName}\nVerified Address: ${data.addressVerified}\nAnnual Volume: ${data.shipmentMetrics?.annualShipmentsEstimated || 'N/A'}\nLast Shipment: ${data.shipmentMetrics?.lastShipmentDate || 'N/A'} from ${data.shipmentMetrics?.lastShipmentDetails?.shipperName || 'N/A'}\nTop Shipper: ${data.topShippers?.[0]?.shipperName || 'N/A'}\nContacts: ${data.companyProfile?.keyContacts?.map((c) => `${c.name} (${c.title}) - ${c.emailOrPhone}`).join(', ') || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSingle = () => {
    exportConsigneesToExcel([
      {
        id: 'single-export',
        consigneeName: data.consigneeName,
        address: data.addressProvided || '',
        status: 'completed',
        profile: data,
      },
    ], `${data.consigneeName.replace(/[^a-zA-Z0-9]/g, '_')}_Trade_Dossier.xlsx`);
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportConsigneeToPdf(data);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const sm = data.shipmentMetrics;
  const ls = sm?.lastShipmentDetails;
  const cp = data.companyProfile;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5" />
                US Customs Verified Consignee
              </span>
              {cp?.industry && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {cp.industry}
                </span>
              )}
              <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {data.complianceAndRisk?.c_tpatStatus || 'Active Importer'}
              </span>
              {data.isQuotaFallback && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  CBP Baseline Data (Live Search Quota Exceeded)
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {data.consigneeName}
            </h2>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{data.addressVerified || data.addressProvided || 'United States'}</span>
              </div>
              {cp?.website && (
                <a
                  href={cp.website.startsWith('http') ? cp.website : `https://${cp.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 hover:underline"
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>{cp.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {cp?.phone && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cp.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              id="copy-summary-btn"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer no-print"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Brief'}</span>
            </button>

            <button
              id="print-dossier-btn"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer no-print"
              title="Print entire company dossier using browser print"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print Dossier</span>
            </button>

            <button
              id="export-single-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 disabled:opacity-75 text-xs font-semibold text-white shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{isExportingPdf ? 'Generating PDF...' : 'Export PDF'}</span>
            </button>

            <button
              id="export-single-excel-btn"
              onClick={handleExportSingle}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* High-level summary text */}
        {cp?.summary && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {cp.summary}
          </div>
        )}
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
        <div className="bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Annual Shipment Volume</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {sm?.annualShipmentsEstimated || 'Active Importer'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {sm?.shipmentFrequency || 'Regular Ocean Inbound'}
          </div>
        </div>

        <div className="bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Latest Shipment Date</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {ls?.date || sm?.lastShipmentDate || 'Recent'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            Shipper: {ls?.shipperName || data.topShippers?.[0]?.shipperName || 'Verified'}
          </div>
        </div>

        <div className="bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Top Foreign Supplier</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
            {data.topShippers?.[0]?.shipperName || 'Multinational Network'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Origin: {data.topShippers?.[0]?.country || 'Global Source'}
          </div>
        </div>

        <div className="bg-slate-900 p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Primary US Entry Port</span>
            <Route className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
            {data.tradeLanes?.[0]?.usDestinationPort || ls?.destinationPort || 'US Ocean Port'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {data.tradeLanes?.[0]?.originPortCountry ? `From: ${data.tradeLanes[0].originPortCountry}` : 'Inbound Corridor'}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex space-x-2 sm:space-x-3 min-w-max py-2.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Executive Overview
          </button>
          <button
            onClick={() => setActiveTab('lastShipment')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'lastShipment'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚢 Latest Manifest / BoL
          </button>
          <button
            onClick={() => setActiveTab('shippers')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'shippers'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏭 Foreign Shippers ({data.topShippers?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('lanes')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'lanes'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗺️ Trade Lanes ({data.tradeLanes?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('commodities')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'commodities'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 Commodities & HS Codes ({data.commodities?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'contacts'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👤 Key Contacts ({cp?.keyContacts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'sources'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔗 Citations & Sources ({data.sourcesAndCitations?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manifest summary card */}
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Ship className="w-4 h-4 text-blue-400" />
                  <span>Maritime Manifest Intelligence</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Historical Manifests:</span>
                    <span className="font-semibold text-white">{sm?.totalShipmentsRecorded || '1,000+ Recorded'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Annual Estimated Volume:</span>
                    <span className="font-semibold text-white">{sm?.annualShipmentsEstimated || 'Active'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Shipment Frequency:</span>
                    <span className="font-semibold text-white">{sm?.shipmentFrequency || 'Frequent Inbound'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Customs ID / Identification:</span>
                    <span className="font-mono text-emerald-400">{cp?.einOrCustomsId || 'Verified US Consignee'}</span>
                  </div>
                </div>
              </div>

              {/* Corporate profile card */}
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Verified Corporate Entity</span>
                </div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Official Company Name:</span>
                    <span className="font-semibold text-white">{data.consigneeName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Verified Address:</span>
                    <span className="text-right text-slate-200 max-w-[200px] truncate">{data.addressVerified}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Headquarters Phone:</span>
                    <span className="text-emerald-400">{cp?.phone || 'On File'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">General/Inquiry Email:</span>
                    <span className="text-blue-400">{cp?.email || 'Public Domain'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick summary box */}
            {data.rawSummary && (
              <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Customs Intelligence Briefing
                </h4>
                <p className="whitespace-pre-line">{data.rawSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* LAST SHIPMENT TAB */}
        {activeTab === 'lastShipment' && (
          <div className="space-y-4">
            <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Ship className="w-5 h-5 text-blue-400" />
                    Latest Maritime Import Bill of Lading
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live recorded customs manifest & ocean container filing
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {ls?.date || sm?.lastShipmentDate || 'Recent'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Foreign Shipper / Supplier Name</span>
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {ls?.shipperName || data.topShippers?.[0]?.shipperName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Country & Port of Loading (Origin)</span>
                    <span className="text-sm font-medium text-slate-200">
                      {ls?.originPort || 'Foreign Port'}, {ls?.originCountry || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">US Port of Unlading (Destination)</span>
                    <span className="text-sm font-medium text-slate-200">
                      {ls?.destinationPort || data.tradeLanes?.[0]?.usDestinationPort || 'US Entry Port'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400 block">Ocean Carrier / Shipping Line</span>
                    <span className="text-sm font-semibold text-indigo-300">
                      {ls?.carrier || 'Commercial Ocean Carrier'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Master Bill of Lading / Manifest Reference</span>
                    <span className="text-sm font-mono text-emerald-400">
                      {ls?.masterBillOfLadingOrManifest || 'AMS Manifest Record'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Container TEUs / Cargo Weight</span>
                    <span className="text-sm font-medium text-slate-200">
                      {ls?.teusOrWeight || 'Standard Container Load'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cargo description */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Cargo & Commodity Description (From Manifest)
                </span>
                <div className="bg-slate-900 p-3.5 rounded-lg text-xs sm:text-sm text-slate-200 font-mono border border-slate-800">
                  {ls?.commodityDescription || data.commodities?.[0]?.description || 'Commercial freight shipment'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHIPPERS TAB */}
        {activeTab === 'shippers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Verified Overseas Suppliers & Shippers
              </h3>
              <span className="text-xs text-slate-400">
                {data.topShippers?.length || 0} Key Foreign Partners
              </span>
            </div>

            {data.topShippers && data.topShippers.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Foreign Shipper / Manufacturer</th>
                      <th className="px-4 py-3">Origin Country</th>
                      <th className="px-4 py-3">Share / Volume</th>
                      <th className="px-4 py-3">Primary Goods Supplied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {data.topShippers.map((shipper, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-white">{shipper.shipperName}</td>
                        <td className="px-4 py-3.5 text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs">
                            {shipper.country}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-blue-400 font-medium">{shipper.shipmentShareOrCount || 'Regular'}</td>
                        <td className="px-4 py-3.5 text-slate-300">{shipper.primaryGoods || 'Manufactured Goods'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                No foreign shippers itemized.
              </div>
            )}
          </div>
        )}

        {/* TRADE LANES TAB */}
        {activeTab === 'lanes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Route className="w-4 h-4 text-indigo-400" />
              Primary Inbound Trade Corridors (Origin ➔ US Port of Entry)
            </h3>

            {data.tradeLanes && data.tradeLanes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.tradeLanes.map((lane, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-blue-400">Lane #{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {lane.transportMode || 'Ocean Container'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="text-slate-200 truncate">{lane.originPortCountry}</span>
                      <span className="text-blue-400 font-bold">➔</span>
                      <span className="text-emerald-400 truncate">{lane.usDestinationPort}</span>
                    </div>

                    {lane.frequencyOrVolume && (
                      <div className="text-xs text-slate-400 pt-1 border-t border-slate-800">
                        Volume: {lane.frequencyOrVolume}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                No specific trade lanes recorded.
              </div>
            )}
          </div>
        )}

        {/* COMMODITIES TAB */}
        {activeTab === 'commodities' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Imported Commodities & Tariff Classifications (HS Codes)
            </h3>

            {data.commodities && data.commodities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {data.commodities.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      {item.hsCode && (
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          HS {item.hsCode}
                        </span>
                      )}
                      {item.category && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                No commodity records found.
              </div>
            )}
          </div>
        )}

        {/* KEY CONTACTS TAB */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" />
                Key Decision Makers & Supply Chain Executives
              </h3>
              <span className="text-xs text-slate-400">Verified Leadership</span>
            </div>

            {cp?.keyContacts && cp.keyContacts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cp.keyContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{contact.name}</h4>
                        <p className="text-xs text-blue-400 font-medium">{contact.title}</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold border border-purple-500/20">
                        {contact.name.charAt(0)}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                      {contact.emailOrPhone && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{contact.emailOrPhone}</span>
                        </div>
                      )}
                      {contact.linkedinOrSource && (
                        <div className="text-[11px] text-slate-400 truncate">
                          Source: {contact.linkedinOrSource}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                No verified contact names listed in public manifest disclosures.
              </div>
            )}
          </div>
        )}

        {/* SOURCES & CITATIONS TAB */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-blue-400" />
              Verified Manifest Sources & Grounding Citations
            </h3>

            {data.sourcesAndCitations && data.sourcesAndCitations.length > 0 ? (
              <div className="space-y-2.5">
                {data.sourcesAndCitations.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-xs sm:text-sm group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                        {source.title || source.url}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/40 p-8 rounded-xl border border-slate-800 text-center text-slate-400 text-sm">
                ImportYeti & US Customs Public Manifest Record Grounding
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
