import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import searchRouter from './routes/search';
import devicesRouter from './routes/devices';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/search', searchRouter);
app.use('/devices', devicesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Smart TV Search backend running on http://0.0.0.0:${PORT}`);
});
