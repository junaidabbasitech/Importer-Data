import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeProfileConsignee } from './_lib/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { consigneeName, address, deepSearch } = req.body || {};

  try {
    const result = await executeProfileConsignee(consigneeName, address, deepSearch);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error profiling consignee:', error);
    if (error && typeof error === 'object' && error.status === 400) {
      return res.status(400).json({ error: error.message });
    }

    const errMsg = error?.message || String(error);
    const isQuotaError =
      error?.status === 429 ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('429') ||
      errMsg.includes('quota');

    if (isQuotaError) {
      return res.status(429).json({
        error:
          'Gemini API rate limit or quota reached. Please wait 15-30 seconds before retrying your search or batch processing.',
      });
    }

    return res.status(500).json({
      error: errMsg || 'An error occurred while fetching trade manifest data.',
    });
  }
}
