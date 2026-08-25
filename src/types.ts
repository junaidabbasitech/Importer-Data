export interface KeyContact {
  name: string;
  title: string;
  emailOrPhone: string;
  linkedinOrSource?: string;
}

export interface ShipperInfo {
  shipperName: string;
  country: string;
  shipmentShareOrCount?: string;
  primaryGoods?: string;
}

export interface TradeLane {
  originPortCountry: string;
  usDestinationPort: string;
  transportMode?: string;
  frequencyOrVolume?: string;
}

export interface CommodityInfo {
  hsCode?: string;
  description: string;
  category?: string;
}

export interface LastShipment {
  date: string;
  shipperName: string;
  originCountry: string;
  originPort: string;
  destinationPort: string;
  carrier?: string;
  masterBillOfLadingOrManifest?: string;
  teusOrWeight?: string;
  commodityDescription: string;
}

export interface ConsigneeProfileData {
  consigneeName: string;
  addressProvided?: string;
  addressVerified: string;
  companyProfile: {
    industry: string;
    website: string;
    phone: string;
    email: string;
    einOrCustomsId?: string;
    activeStatus: string;
    summary: string;
    keyContacts: KeyContact[];
  };
  shipmentMetrics: {
    totalShipmentsRecorded: string;
    annualShipmentsEstimated: string;
    shipmentFrequency: string;
    lastShipmentDate: string;
    lastShipmentDetails: LastShipment;
  };
  topShippers: ShipperInfo[];
  tradeLanes: TradeLane[];
  commodities: CommodityInfo[];
  complianceAndRisk: {
    cbpRiskLevel?: string;
    c_tpatStatus?: string;
    notes?: string;
  };
  sourcesAndCitations: Array<{
    title: string;
    url: string;
  }>;
  rawSummary: string;
  scannedAt: string;
  isQuotaFallback?: boolean;
}

export interface BatchConsigneeItem {
  id: string;
  consigneeName: string;
  address: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  profile?: ConsigneeProfileData;
  progressMessage?: string;
}

export interface CommoditySearchParams {
  commodityOrIndustry: string;
  hsCode?: string;
  minAnnualTeus: number;
  originCountry?: string;
  destinationPort?: string;
  cTpatVerifiedOnly?: boolean;
}

export interface CommoditySearchResultItem {
  id: string;
  rank: number;
  consigneeName: string;
  headquartersAddress: string;
  state: string;
  annualTeusEstimated: number;
  annualTeusFormatted: string;
  primaryCommodity: string;
  hsCodesList: string[];
  topOverseasSupplier: string;
  supplierCountry: string;
  primaryTradeCorridor: string;
  cbpRiskLevel: string;
  c_tpatStatus: string;
  website: string;
  phone: string;
  keyContactName: string;
  keyContactTitle: string;
  keyContactEmailPhone: string;
  fullProfile: ConsigneeProfileData;
}

export interface CommoditySearchHistoryEntry {
  id: string;
  params: CommoditySearchParams;
  timestamp: string;
  totalFound: number;
  totalVolumeTeus: number;
  results: CommoditySearchResultItem[];
}

