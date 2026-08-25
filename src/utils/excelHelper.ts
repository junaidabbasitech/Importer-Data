import * as XLSX from 'xlsx';
import { BatchConsigneeItem, CommoditySearchResultItem, ConsigneeProfileData } from '../types';


/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file and extracts consignee names and addresses
 */
export async function parseUploadedExcel(file: File): Promise<{
  rows: Array<{ name: string; address: string; raw: any }>;
  headers: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('The uploaded file does not contain any sheets.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Read as array of arrays
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('The spreadsheet is empty.');
        }

        // Determine if row 0 is header
        let headerRowIndex = 0;
        let headers: string[] = [];

        // Look for the first non-empty row
        for (let i = 0; i < Math.min(5, rawRows.length); i++) {
          const row = rawRows[i];
          if (row && row.some((cell) => cell && String(cell).trim().length > 0)) {
            headerRowIndex = i;
            headers = row.map((cell) => String(cell || '').trim());
            break;
          }
        }

        // Find candidate columns for Consignee Name and Address
        let nameColIdx = 0;
        let addrColIdx = 1;

        // Check header keywords
        headers.forEach((h, idx) => {
          const lower = h.toLowerCase();
          if (
            lower.includes('consignee') ||
            lower.includes('company') ||
            lower.includes('importer') ||
            lower.includes('client') ||
            lower.includes('name') ||
            lower.includes('buyer')
          ) {
            nameColIdx = idx;
          }
          if (
            lower.includes('address') ||
            lower.includes('street') ||
            lower.includes('location') ||
            lower.includes('city') ||
            lower.includes('state') ||
            lower.includes('zip')
          ) {
            addrColIdx = idx;
          }
        });

        // If headers weren't explicit, defaults are col 0 and col 1
        const extracted: Array<{ name: string; address: string; raw: any }> = [];

        // If the first row looks like data rather than headers (e.g. no string headers), adjust
        const startRow = headerRowIndex + 1;

        for (let i = startRow; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const nameVal = String(row[nameColIdx] || '').trim();
          const addrVal = String(row[addrColIdx] || '').trim();

          // Also check if entire row is just one column
          if (nameVal) {
            extracted.push({
              name: nameVal,
              address: addrVal,
              raw: row,
            });
          }
        }

        // If startRow didn't yield items because header row was actually data
        if (extracted.length === 0 && rawRows.length > 0) {
          for (let i = 0; i < rawRows.length; i++) {
            const row = rawRows[i];
            const nameVal = String(row[0] || '').trim();
            const addrVal = String(row[1] || '').trim();
            if (nameVal) {
              extracted.push({
                name: nameVal,
                address: addrVal,
                raw: row,
              });
            }
          }
        }

        resolve({
          rows: extracted,
          headers: headers.length > 0 ? headers : ['Consignee Name', 'Address'],
        });
      } catch (err: any) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Transforms consignee profile data into an Excel spreadsheet with rich columns
 */
export function exportConsigneesToExcel(items: BatchConsigneeItem[], customFilename?: string) {
  const exportData = items.map((item, index) => {
    const p: ConsigneeProfileData | undefined = item.profile;
    const cp = p?.companyProfile;
    const sm = p?.shipmentMetrics;
    const ls = sm?.lastShipmentDetails;

    // Format key contacts
    const contactsFormatted = cp?.keyContacts
      ? cp.keyContacts
          .map((c) => `${c.name} (${c.title || 'Contact'}${c.emailOrPhone ? `: ${c.emailOrPhone}` : ''})`)
          .join(' | ')
      : '';

    // Format top shippers
    const topShippersFormatted = p?.topShippers
      ? p.topShippers
          .map((s) => `${s.shipperName} [${s.country}]${s.shipmentShareOrCount ? ` (${s.shipmentShareOrCount})` : ''}`)
          .join('; ')
      : '';

    // Format trade lanes
    const tradeLanesFormatted = p?.tradeLanes
      ? p.tradeLanes.map((l) => `${l.originPortCountry} ➔ ${l.usDestinationPort}`).join('; ')
      : '';

    // Format commodities
    const commoditiesFormatted = p?.commodities
      ? p.commodities
          .map((c) => `${c.hsCode ? `[HS:${c.hsCode}] ` : ''}${c.description}`)
          .join('; ')
      : '';

    // Format sources
    const sourcesFormatted = p?.sourcesAndCitations
      ? p.sourcesAndCitations.map((s) => s.url || s.title).join(' | ')
      : '';

    return {
      'No.': index + 1,
      'Consignee Name (Input)': item.consigneeName,
      'Address (Input)': item.address || 'N/A',
      'Scan Status': item.status.toUpperCase(),
      'Verified Corporate / DBA Name': p?.consigneeName || item.consigneeName,
      'Verified US Address / Distribution HQ': p?.addressVerified || 'N/A',
      'Industry Sector': cp?.industry || 'N/A',
      'Official Website': cp?.website || 'N/A',
      'Verified Phone': cp?.phone || 'N/A',
      'Verified Contact Email': cp?.email || 'N/A',
      'Key Decision Makers & Supply Chain Contacts': contactsFormatted || 'N/A',
      'Estimated Annual Shipments (TEUs / Volume)': sm?.annualShipmentsEstimated || 'N/A',
      'Shipment Frequency': sm?.shipmentFrequency || 'N/A',
      'Total Recorded Manifests': sm?.totalShipmentsRecorded || 'N/A',
      'Last Shipment Date': ls?.date || sm?.lastShipmentDate || 'N/A',
      'Last Foreign Shipper / Supplier': ls?.shipperName || 'N/A',
      'Last Origin Port & Country': `${ls?.originPort || ''} ${ls?.originCountry ? `(${ls.originCountry})` : ''}`.trim() || 'N/A',
      'Last US Destination Port': ls?.destinationPort || 'N/A',
      'Last Ocean Carrier / Line': ls?.carrier || 'N/A',
      'Last Bill of Lading / Manifest ID': ls?.masterBillOfLadingOrManifest || 'N/A',
      'Last Shipment TEUs / Weight': ls?.teusOrWeight || 'N/A',
      'Last Manifest Commodity Description': ls?.commodityDescription || 'N/A',
      'Top Foreign Suppliers & Shippers': topShippersFormatted || 'N/A',
      'Primary Trade Lanes (Origin ➔ US Port)': tradeLanesFormatted || 'N/A',
      'Imported Commodities & HS Codes': commoditiesFormatted || 'N/A',
      'CBP Risk Level & C-TPAT Status': `${p?.complianceAndRisk?.cbpRiskLevel || ''} ${p?.complianceAndRisk?.c_tpatStatus ? `| ${p.complianceAndRisk.c_tpatStatus}` : ''}`.trim() || 'Verified US Importer',
      'Intelligence Sources & Grounding Links': sourcesFormatted || 'ImportYeti / US Customs Public Records',
      'Scanned Timestamp': p?.scannedAt || new Date().toISOString(),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const colWidths = [
    { wch: 6 }, // No
    { wch: 28 }, // Consignee Name (Input)
    { wch: 26 }, // Address (Input)
    { wch: 14 }, // Scan Status
    { wch: 30 }, // Verified Name
    { wch: 36 }, // Verified Address
    { wch: 22 }, // Industry
    { wch: 25 }, // Website
    { wch: 18 }, // Phone
    { wch: 24 }, // Email
    { wch: 45 }, // Key Contacts
    { wch: 26 }, // Annual Shipments
    { wch: 24 }, // Frequency
    { wch: 24 }, // Total Recorded
    { wch: 18 }, // Last Shipment Date
    { wch: 32 }, // Last Shipper
    { wch: 28 }, // Last Origin Port
    { wch: 24 }, // Last US Dest Port
    { wch: 20 }, // Last Carrier
    { wch: 24 }, // Last BoL
    { wch: 22 }, // Last Weight/TEUs
    { wch: 38 }, // Last Commodity
    { wch: 45 }, // Top Shippers
    { wch: 40 }, // Trade Lanes
    { wch: 40 }, // Commodities
    { wch: 28 }, // CBP Risk
    { wch: 40 }, // Sources
    { wch: 22 }, // Timestamp
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignee Intelligence');

  // Generate binary and trigger download
  const filename =
    customFilename ||
    `US_Consignee_Customs_Intelligence_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports to CSV
 */
export function exportConsigneesToCsv(items: BatchConsigneeItem[], customFilename?: string) {
  const exportData = items.map((item, index) => {
    const p = item.profile;
    const sm = p?.shipmentMetrics;
    const ls = sm?.lastShipmentDetails;

    return {
      'No.': index + 1,
      'Consignee Name': item.consigneeName,
      'Input Address': item.address || '',
      'Status': item.status,
      'Verified Address': p?.addressVerified || '',
      'Website': p?.companyProfile?.website || '',
      'Phone': p?.companyProfile?.phone || '',
      'Email': p?.companyProfile?.email || '',
      'Annual Shipments': sm?.annualShipmentsEstimated || '',
      'Last Shipment Date': ls?.date || sm?.lastShipmentDate || '',
      'Last Shipper': ls?.shipperName || '',
      'Last Origin Port': ls?.originPort || '',
      'Last US Port': ls?.destinationPort || '',
      'Last Commodity': ls?.commodityDescription || '',
      'Top Shippers': p?.topShippers?.map((s) => s.shipperName).join('; ') || '',
      'Trade Lanes': p?.tradeLanes?.map((l) => `${l.originPortCountry}->${l.usDestinationPort}`).join('; ') || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    customFilename || `US_Consignee_Data_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a pre-populated sample Excel workbook for immediate testing
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Consignee Name': 'Target Corporation',
      'Address': '1000 Nicollet Mall, Minneapolis, MN 55403',
    },
    {
      'Consignee Name': 'Williams-Sonoma Inc',
      'Address': '3250 Van Ness Ave, San Francisco, CA 94109',
    },
    {
      'Consignee Name': 'Trek Bicycle Corporation',
      'Address': '801 W Madison St, Waterloo, WI 53594',
    },
    {
      'Consignee Name': 'Yeti Coolers LLC',
      'Address': '7601 Southwest Pkwy, Austin, TX 78735',
    },
    {
      'Consignee Name': 'Ashley Furniture Industries',
      'Address': '1 Ashley Way, Arcadia, WI 54612',
    },
    {
      'Consignee Name': 'Wayfair LLC',
      'Address': '4 Copley Pl, Boston, MA 02116',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [{ wch: 32 }, { wch: 45 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Consignees');

  XLSX.writeFile(workbook, 'Sample_USA_Consignees_Import_Template.xlsx');
}

/**
 * Exports Commodity Search Results (20+ Consignees) to Excel
 */
export function exportCommoditySearchResultsToExcel(
  items: CommoditySearchResultItem[],
  queryLabel: string,
  customFilename?: string
) {
  const exportData = items.map((item, index) => {
    const p = item.fullProfile;
    const cp = p?.companyProfile;
    const sm = p?.shipmentMetrics;
    const ls = sm?.lastShipmentDetails;

    return {
      'Rank': index + 1,
      'Consignee / Importer Name': item.consigneeName,
      'Verified HQ Address': item.headquartersAddress,
      'State': item.state,
      'Annual Volume (TEUs/yr)': item.annualTeusEstimated,
      'Annual Volume Text': item.annualTeusFormatted,
      'Primary Industry / Commodity': item.primaryCommodity,
      'HS Codes': item.hsCodesList.join(', '),
      'Top Overseas Supplier': item.topOverseasSupplier,
      'Supplier Origin Country': item.supplierCountry,
      'Primary Trade Corridor': item.primaryTradeCorridor,
      'CBP Risk Level': item.cbpRiskLevel,
      'C-TPAT Status': item.c_tpatStatus,
      'Official Website': item.website,
      'Phone': item.phone,
      'Key Decision Maker': item.keyContactName,
      'Contact Title': item.keyContactTitle,
      'Contact Info': item.keyContactEmailPhone,
      'Last Shipment Date': ls?.date || sm?.lastShipmentDate || 'N/A',
      'Last Foreign Shipper': ls?.shipperName || 'N/A',
      'Last Origin Port': ls?.originPort || 'N/A',
      'Last US Port of Entry': ls?.destinationPort || 'N/A',
      'Last Carrier': ls?.carrier || 'N/A',
      'Last BoL Manifest ID': ls?.masterBillOfLadingOrManifest || 'N/A',
      'Last Goods Description': ls?.commodityDescription || 'N/A',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet['!cols'] = [
    { wch: 6 },  // Rank
    { wch: 32 }, // Consignee Name
    { wch: 36 }, // Verified Address
    { wch: 10 }, // State
    { wch: 18 }, // Annual TEUs
    { wch: 20 }, // Annual Volume Text
    { wch: 30 }, // Primary Commodity
    { wch: 22 }, // HS Codes
    { wch: 32 }, // Top Supplier
    { wch: 20 }, // Supplier Country
    { wch: 32 }, // Primary Corridor
    { wch: 20 }, // Risk
    { wch: 22 }, // C-TPAT
    { wch: 25 }, // Website
    { wch: 18 }, // Phone
    { wch: 26 }, // Contact Name
    { wch: 28 }, // Contact Title
    { wch: 28 }, // Contact Info
    { wch: 18 }, // Last Date
    { wch: 30 }, // Last Shipper
    { wch: 24 }, // Last Origin Port
    { wch: 24 }, // Last US Port
    { wch: 20 }, // Last Carrier
    { wch: 22 }, // Last BoL
    { wch: 36 }, // Goods Desc
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignees by Commodity');

  const cleanQuery = queryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename =
    customFilename ||
    `US_Consignees_${cleanQuery}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports Commodity Search Results (or selected items) to a standard CSV file
 */
export function exportCommoditySearchResultsToCsv(
  items: CommoditySearchResultItem[],
  queryLabel: string,
  customFilename?: string
) {
  const exportData = items.map((item, index) => {
    const p = item.fullProfile;
    const sm = p?.shipmentMetrics;
    const ls = sm?.lastShipmentDetails;

    return {
      'Rank': index + 1,
      'Consignee / Importer Name': item.consigneeName,
      'Verified HQ Address': item.headquartersAddress,
      'State': item.state,
      'Annual Volume (TEUs/yr)': item.annualTeusEstimated,
      'Annual Volume Text': item.annualTeusFormatted,
      'Primary Industry / Commodity': item.primaryCommodity,
      'HS Codes': item.hsCodesList.join('; '),
      'Top Overseas Supplier': item.topOverseasSupplier,
      'Supplier Origin Country': item.supplierCountry,
      'Primary Trade Corridor': item.primaryTradeCorridor,
      'CBP Risk Level': item.cbpRiskLevel,
      'C-TPAT Status': item.c_tpatStatus,
      'Official Website': item.website || 'N/A',
      'Phone': item.phone || 'N/A',
      'Key Decision Maker': item.keyContactName || 'N/A',
      'Contact Title': item.keyContactTitle || 'N/A',
      'Contact Info': item.keyContactEmailPhone || 'N/A',
      'Last Shipment Date': ls?.date || sm?.lastShipmentDate || 'N/A',
      'Last Foreign Shipper': ls?.shipperName || 'N/A',
      'Last Origin Port': ls?.originPort || 'N/A',
      'Last US Port of Entry': ls?.destinationPort || 'N/A',
      'Last Carrier': ls?.carrier || 'N/A',
      'Last BoL Manifest ID': ls?.masterBillOfLadingOrManifest || 'N/A',
      'Last Goods Description': ls?.commodityDescription || 'N/A',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Consignees');

  const cleanQuery = queryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename =
    customFilename ||
    `US_Consignees_${cleanQuery}_${new Date().toISOString().slice(0, 10)}.csv`;

  XLSX.writeFile(workbook, filename, { bookType: 'csv' });
}

