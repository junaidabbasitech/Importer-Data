import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { executeProfileConsignee, executeSearchByCommodity } from './api/_lib/gemini.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Single & Bulk consignee profiling endpoint
app.post('/api/profile-consignee', async (req, res) => {
  const { consigneeName, address, deepSearch } = req.body || {};

  try {
    const result = await executeProfileConsignee(consigneeName, address, deepSearch);
    res.json(result);
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

    res.status(500).json({
      error: errMsg || 'An error occurred while fetching trade manifest data.',
    });
  }
});

// Commodity & Industry Search Endpoint
app.post('/api/search-by-commodity', async (req, res) => {
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
    res.json(result);
  } catch (error: any) {
    console.error('Error in commodity search:', error);
    if (error && typeof error === 'object' && error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to search consignees by commodity parameters.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trade Intelligence Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
