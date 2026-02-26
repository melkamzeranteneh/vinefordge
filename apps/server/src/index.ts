import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import forgeRouter from './routes/forge';
import boardsRouter from './routes/boards';
import { startFlushLoop } from './services/yjsPersistence';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/forge', forgeRouter);
app.use('/api/boards', boardsRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Vineforge server running on port ${port}`);
});

startFlushLoop();
