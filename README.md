# US Customs & Trade Intelligence App

A web application for US Customs manifest intelligence, importer profiling, and commodity search powered by Gemini AI.

## LOCAL DEVELOPMENT

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start local development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` (or the local dev URL) in your browser.

## VERCEL DEPLOYMENT

1. Import this repository into Vercel as a standard Vite + Serverless project.
2. Add `GEMINI_API_KEY` under **Project Settings > Environment Variables** in Vercel.
3. Deploy the application.
4. Never upload or commit `.env` or API keys to GitHub.
5. All Gemini API requests execute securely on the server side via Vercel Serverless Functions (`/api/*`). No API keys are exposed to the client bundle.
