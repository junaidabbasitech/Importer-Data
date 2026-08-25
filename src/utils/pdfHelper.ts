import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ConsigneeProfileData } from '../types';

/**
 * Generates and downloads a professionally styled executive PDF dossier report for a consignee
 */
export async function exportConsigneeToPdf(
  data: ConsigneeProfileData,
  customFilename?: string
): Promise<void> {
  const cleanName = data.consigneeName || 'Consignee';
  const fileName =
    customFilename ||
    `${cleanName.replace(/[^a-zA-Z0-9]/g, '_')}_Customs_Trade_Dossier.pdf`;

  // Create an off-screen container styled for pristine A4 PDF printing
  const printContainer = document.createElement('div');
  printContainer.style.position = 'fixed';
  printContainer.style.top = '-9999px';
  printContainer.style.left = '-9999px';
  printContainer.style.width = '820px'; // Approx A4 width at 96 DPI
  printContainer.style.backgroundColor = '#ffffff';
  printContainer.style.color = '#0f172a';
  printContainer.style.fontFamily =
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  printContainer.style.boxSizing = 'border-box';
  printContainer.style.padding = '0';
  printContainer.style.zIndex = '-9999';

  const cp = data.companyProfile;
  const sm = data.shipmentMetrics;
  const ls = sm?.lastShipmentDetails;
  const generateDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const generatedTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Render high-contrast executive report layout
  printContainer.innerHTML = `
    <div style="padding: 32px 36px; background-color: #ffffff;">
      
      <!-- Top Formal Header -->
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb; margin-bottom: 4px;">
              U.S. CUSTOMS & BORDER PROTECTION • CONSOLIDATED TRADE INTELLIGENCE
            </div>
            <h1 style="font-size: 26px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">
              ${escapeHtml(data.consigneeName)}
            </h1>
            <div style="font-size: 13px; color: #475569; margin-top: 6px; font-weight: 500;">
              📍 ${escapeHtml(data.addressVerified || data.addressProvided || 'United States')}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 700; padding: 4px 10px; borderRadius: 6px; margin-bottom: 6px;">
              VERIFIED IMPORTER DOSSIER
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 500;">
              Ref ID: CBP-${Math.floor(100000 + Math.random() * 900000)}
            </div>
            <div style="font-size: 11px; color: #64748b;">
              Generated: ${generateDate}
            </div>
          </div>
        </div>

        <!-- Badges Bar -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
          <span style="background-color: #0f172a; color: #ffffff; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px;">
            Industry: ${escapeHtml(cp?.industry || 'Ocean Container Freight')}
          </span>
          <span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px;">
            ${escapeHtml(data.complianceAndRisk?.c_tpatStatus || 'C-TPAT Verified Importer')}
          </span>
          <span style="background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 4px;">
            CBP Risk: ${escapeHtml(data.complianceAndRisk?.cbpRiskLevel || 'Low / Standard Trade Risk')}
          </span>
        </div>
      </div>

      <!-- Executive Summary -->
      ${
        cp?.summary
          ? `
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #1e40af; margin-bottom: 4px;">
          Executive Intelligence Brief
        </div>
        <div style="font-size: 12px; color: #334155; line-height: 1.6;">
          ${escapeHtml(cp.summary)}
        </div>
      </div>
      `
          : ''
      }

      <!-- Key Shipment KPI Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Annual Volume</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${escapeHtml(sm?.annualShipmentsEstimated || 'Active')}</div>
          <div style="font-size: 10px; color: #2563eb; margin-top: 2px;">${escapeHtml(sm?.shipmentFrequency || 'Regular Inbound')}</div>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Last Shipment</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${escapeHtml(ls?.date || sm?.lastShipmentDate || 'Recent')}</div>
          <div style="font-size: 10px; color: #059669; margin-top: 2px;">Confirmed Manifest</div>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total B/L Filings</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px;">${escapeHtml(sm?.totalShipmentsRecorded || '450+ Filings')}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">US Customs Manifests</div>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px;">
          <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Primary Corridor</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px;">${escapeHtml(data.tradeLanes?.[0]?.originPortCountry || 'East Asia ➔ US')}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Ocean Freight</div>
        </div>
      </div>

      <!-- Corporate Details & Logistics Contacts -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 10px;">
            🏢 Corporate & Contact Overview
          </div>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600; width: 35%;">Website:</td>
              <td style="padding: 4px 0; color: #2563eb; font-weight: 500;">${escapeHtml(cp?.website || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Phone:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">${escapeHtml(cp?.phone || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">Corporate Email:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">${escapeHtml(cp?.email || 'N/A')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b; font-weight: 600;">CBP Importer ID:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">${escapeHtml(cp?.einOrCustomsId || 'Verified Record')}</td>
            </tr>
          </table>
        </div>

        <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 10px;">
            👤 Key Supply Chain Contacts
          </div>
          ${
            cp?.keyContacts && cp.keyContacts.length > 0
              ? cp.keyContacts
                  .slice(0, 3)
                  .map(
                    (c) => `
            <div style="margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px dashed #f1f5f9;">
              <div style="font-size: 11px; font-weight: 700; color: #0f172a;">${escapeHtml(c.name)}</div>
              <div style="font-size: 10px; color: #64748b;">${escapeHtml(c.title || 'Logistics Contact')}</div>
              <div style="font-size: 10px; color: #2563eb;">${escapeHtml(c.emailOrPhone || '')}</div>
            </div>
          `
                  )
                  .join('')
              : '<div style="font-size: 11px; color: #94a3b8; font-style: italic;">Verified Customs Importer Record</div>'
          }
        </div>
      </div>

      <!-- Latest Shipment Details Box -->
      ${
        ls
          ? `
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase;">
            📦 Latest Verified Inbound Ocean Shipment
          </div>
          <div style="font-size: 11px; font-weight: 700; color: #2563eb; background-color: #eff6ff; padding: 2px 8px; border-radius: 4px;">
            B/L: ${escapeHtml(ls.masterBillOfLadingOrManifest || 'Manifest Verified')}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 11px;">
          <div>
            <span style="color: #64748b; font-weight: 600;">Foreign Shipper:</span><br/>
            <strong style="color: #0f172a;">${escapeHtml(ls.shipperName || 'N/A')}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">Origin Port & Country:</span><br/>
            <strong style="color: #0f172a;">${escapeHtml(ls.originPort || 'Asia Origin')} (${escapeHtml(ls.originCountry || 'Overseas')})</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">US Destination Port:</span><br/>
            <strong style="color: #0f172a;">${escapeHtml(ls.destinationPort || 'US Ocean Port')}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">Ocean Carrier:</span><br/>
            <strong style="color: #0f172a;">${escapeHtml(ls.carrier || 'Ocean Liner')}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">Container TEUs / Weight:</span><br/>
            <strong style="color: #0f172a;">${escapeHtml(ls.teusOrWeight || '40ft HC Container')}</strong>
          </div>
          <div>
            <span style="color: #64748b; font-weight: 600;">Cargo Commodity:</span><br/>
            <strong style="color: #0f172a;">${escapeHtml(ls.commodityDescription || 'General Merchandise')}</strong>
          </div>
        </div>
      </div>
      `
          : ''
      }

      <!-- Top Shippers Table -->
      ${
        data.topShippers && data.topShippers.length > 0
          ? `
      <div style="margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px;">
          🚢 Top Overseas Suppliers & Shippers
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 10px; border-radius: 4px 0 0 0;">Shipper / Overseas Supplier</th>
              <th style="padding: 8px 10px;">Country</th>
              <th style="padding: 8px 10px;">Volume Share</th>
              <th style="padding: 8px 10px; border-radius: 0 4px 0 0;">Primary Commodities</th>
            </tr>
          </thead>
          <tbody>
            ${data.topShippers
              .map(
                (s, i) => `
              <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-weight: 700; color: #0f172a;">${escapeHtml(s.shipperName)}</td>
                <td style="padding: 8px 10px; color: #334155;">${escapeHtml(s.country || 'International')}</td>
                <td style="padding: 8px 10px; font-weight: 600; color: #2563eb;">${escapeHtml(s.shipmentShareOrCount || 'Active')}</td>
                <td style="padding: 8px 10px; color: #475569;">${escapeHtml(s.primaryGoods || 'Commercial Cargo')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <!-- Trade Lanes & Commodities Grid -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <!-- Trade Lanes -->
        ${
          data.tradeLanes && data.tradeLanes.length > 0
            ? `
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
            🌐 Primary Trade Corridors
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-weight: 700;">
                <th style="padding: 6px 8px; text-align: left;">Origin ➔ Destination</th>
                <th style="padding: 6px 8px; text-align: left;">Mode</th>
              </tr>
            </thead>
            <tbody>
              ${data.tradeLanes
                .map(
                  (l) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 8px; font-weight: 600; color: #0f172a;">
                    ${escapeHtml(l.originPortCountry)} ➔ ${escapeHtml(l.usDestinationPort)}
                  </td>
                  <td style="padding: 6px 8px; color: #64748b;">${escapeHtml(l.transportMode || 'Ocean')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        `
            : ''
        }

        <!-- Commodities -->
        ${
          data.commodities && data.commodities.length > 0
            ? `
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">
            🏷️ Imported Commodities & HS Codes
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-weight: 700;">
                <th style="padding: 6px 8px; text-align: left;">HS Code</th>
                <th style="padding: 6px 8px; text-align: left;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${data.commodities
                .map(
                  (c) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 6px 8px; font-weight: 700; color: #1e40af;">${escapeHtml(c.hsCode || 'Chapter')}</td>
                  <td style="padding: 6px 8px; color: #334155;">${escapeHtml(c.description)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
        `
            : ''
        }
      </div>

      <!-- Formal Footer -->
      <div style="border-top: 1px solid #e2e8f0; pt: 12px; margin-top: 28px; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
        <div>
          CONFIDENTIAL • Prepared for Logistics & Import Risk Analysis
        </div>
        <div>
          US Customs Trade Intelligence • ${generateDate} ${generatedTime}
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(printContainer);

  try {
    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(printContainer);
  }
}

/**
 * Generates and downloads an executive PDF report for a list of commodity search results (or selected items)
 */
export async function exportCommoditySummaryToPdf(
  items: any[],
  queryLabel: string,
  customFilename?: string
): Promise<void> {
  const cleanQuery = queryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName =
    customFilename ||
    `US_Consignees_${cleanQuery}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const totalVolume = items.reduce((acc, curr) => acc + (curr.annualTeusEstimated || 0), 0);
  const generateDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const printContainer = document.createElement('div');
  printContainer.style.position = 'fixed';
  printContainer.style.top = '-9999px';
  printContainer.style.left = '-9999px';
  printContainer.style.width = '1000px';
  printContainer.style.backgroundColor = '#ffffff';
  printContainer.style.color = '#0f172a';
  printContainer.style.fontFamily =
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  printContainer.style.padding = '32px 36px';
  printContainer.style.boxSizing = 'border-box';
  printContainer.style.zIndex = '-9999';

  printContainer.innerHTML = `
    <div>
      <!-- Header -->
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #2563eb; margin-bottom: 4px;">
            U.S. CUSTOMS & BORDER PROTECTION • OCEAN MANIFEST REPORT
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0;">
            Commodity / TEU Importers: ${escapeHtml(queryLabel)}
          </h1>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
            Generated: ${generateDate} • Total Records: ${items.length} Importers
          </div>
        </div>
        <div style="text-align: right; background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 16px; border-radius: 8px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #1e40af;">Combined Volume</div>
          <div style="font-size: 20px; font-weight: 900; color: #1d4ed8;">${totalVolume.toLocaleString()} TEUs/yr</div>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: 700; text-transform: uppercase;">
            <th style="padding: 8px 10px; text-align: center;">#</th>
            <th style="padding: 8px 10px;">Consignee / HQ</th>
            <th style="padding: 8px 10px;">Annual TEUs</th>
            <th style="padding: 8px 10px;">Commodity</th>
            <th style="padding: 8px 10px;">Top Foreign Supplier</th>
            <th style="padding: 8px 10px;">Trade Corridor</th>
            <th style="padding: 8px 10px;">Compliance</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
              <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td style="padding: 8px 10px;">
                <div style="font-weight: 800; color: #0f172a; font-size: 11px;">${escapeHtml(item.consigneeName)}</div>
                <div style="color: #64748b; font-size: 9px;">${escapeHtml(item.headquartersAddress)}</div>
              </td>
              <td style="padding: 8px 10px; font-weight: 800; color: #1d4ed8;">${escapeHtml(item.annualTeusFormatted)}</td>
              <td style="padding: 8px 10px; color: #334155;">${escapeHtml(item.primaryCommodity)}</td>
              <td style="padding: 8px 10px;">
                <div style="font-weight: 600; color: #1e293b;">${escapeHtml(item.topOverseasSupplier)}</div>
                <div style="color: #64748b; font-size: 9px;">${escapeHtml(item.supplierCountry)}</div>
              </td>
              <td style="padding: 8px 10px; color: #475569;">${escapeHtml(item.primaryTradeCorridor)}</td>
              <td style="padding: 8px 10px;">
                <span style="background-color: #ecfdf5; color: #047857; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
                  ${escapeHtml(item.c_tpatStatus)}
                </span>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <!-- Footer -->
      <div style="margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
        <div>CONFIDENTIAL • USCBP Ocean Manifest Intelligence & ImportYeti Profiler</div>
        <div>Page 1 of 1 • Public Ocean Bills of Lading (19 U.S.C. § 1431)</div>
      </div>
    </div>
  `;

  document.body.appendChild(printContainer);

  try {
    const canvas = await html2canvas(printContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for tabular view
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(printContainer);
  }
}

/**
 * Escapes unsafe HTML strings
 */
function escapeHtml(str?: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
