import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import pino from 'pino';
import axios from 'axios';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';

import { config } from './config.js';
import { createWebSocketServer } from './websocket.js';

// Import routes
import blocksRouter from './routes/blocks.js';
import transactionsRouter from './routes/transactions.js';
import accountsRouter from './routes/accounts.js';
import statsRouter from './routes/stats.js';
import twilightRouter from './routes/twilight.js';
import validatorsRouter from './routes/validators.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/health',
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
  }
});

// API Routes
app.use('/api/blocks', blocksRouter);
app.use('/api/txs', transactionsRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/twilight', twilightRouter);
app.use('/api/validators', validatorsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = createWebSocketServer(server);

// Sync withdrawals from LCD endpoint
async function syncWithdrawals() {
  try {
    const res = await axios.get(
      `${config.lcdUrl}/twilight-project/nyks/bridge/withdraw_btc_request_all`,
      { timeout: 30000 }
    );
    const withdrawals = res.data?.withdrawRequest || [];

    let synced = 0;
    for (const w of withdrawals) {
      await prisma.btcWithdrawal.upsert({
        where: { withdrawIdentifier: w.withdrawIdentifier },
        update: { isConfirmed: w.isConfirmed },
        create: {
          withdrawIdentifier: w.withdrawIdentifier,
          withdrawAddress: w.withdrawAddress,
          withdrawReserveId: w.withdrawReserveId || '0',
          withdrawAmount: BigInt(w.withdrawAmount || '0'),
          twilightAddress: w.twilightAddress,
          isConfirmed: w.isConfirmed,
          blockHeight: parseInt(w.CreationTwilightBlockHeight || '0'),
        },
      });
      synced++;
    }
    logger.info({ count: synced }, 'Withdrawals synced from LCD');
  } catch (error) {
    logger.error({ error }, 'Failed to sync withdrawals from LCD');
  }
}

// Start server
async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    process.exit(1);
  }

  // Sync withdrawals from LCD on startup and every 20 minutes
  syncWithdrawals();
  setInterval(syncWithdrawals, 20 * 60 * 1000);

  server.listen(config.port, config.host, () => {
    logger.info(
      { port: config.port, host: config.host },
      'Twilight Explorer API server started'
    );
    logger.info({ path: '/ws' }, 'WebSocket server available');
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');
    wss.close();
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error({ error }, 'Fatal error');
  process.exit(1);
});
