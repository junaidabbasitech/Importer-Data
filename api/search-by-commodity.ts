import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeSearchByCommodity } from './_lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    commodityOrIndustry,
    hsCode,
    minAnnualTeus,
    originCountry,
    destinationPort,
    cTpatVerifiedOnly,
  } = req.body || {};

  try {
    const result = await executeSearchByCommodity({
      commodityOrIndustry,
      hsCode,
      minAnnualTeus,
      originCountry,
      destinationPort,
      cTpatVerifiedOnly,
    });
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in commodity search:', error);
    if (error && typeof error === 'object' && error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to search consignees by commodity parameters.' });
  }
}
