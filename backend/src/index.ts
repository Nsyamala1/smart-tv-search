import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import searchRouter from './routes/search';
import devicesRouter from './routes/devices';
import { requireToken, rateLimit, dailyCap } from './lib/security';

/**
 * MODE decides what this process exposes:
 *   search (default)  AI search only. This is what runs on Railway.
 *   tv                TV control only. Runs at home on the same Wi-Fi as the TV.
 *   all               both, for local development.
 * The default is the safe one: TV control is never exposed unless asked for.
 */
const MODE = (process.env.MODE ?? 'search').toLowerCase();
if (!['search', 'tv', 'all'].includes(MODE)) {
  console.error(`Unknown MODE "${MODE}". Use search, tv or all.`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT ?? 3001;

// Railway sits behind a proxy; this makes req.ip the real client address.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '4kb' }));

if (MODE === 'search' || MODE === 'all') {
  app.use(
    '/search',
    rateLimit(Number(process.env.SEARCH_PER_MINUTE ?? 10), 60_000),
    requireToken('APP_TOKEN'),
    dailyCap(Number(process.env.DAILY_SEARCH_LIMIT ?? 300)),
    searchRouter
  );
}

if (MODE === 'tv' || MODE === 'all') {
  app.use('/devices', rateLimit(60, 60_000), requireToken('TV_TOKEN'), devicesRouter);
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: MODE });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Smart TV Search (${MODE}) listening on 0.0.0.0:${PORT}`);
});
