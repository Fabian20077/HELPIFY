// ============================================================================
// Helpify — Express Application Setup
// Configura middleware de seguridad, CORS, parsing y rutas
// ============================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { AppError } from './middlewares/error.middleware';
import { apiLimiter, authLimiter } from './middlewares/rate-limiter';
import logger from './lib/logger';

dotenv.config();

const app = express();

// ── Seguridad (RNF-10) ──────────────────────────────────────────────────────
// Helmet configura: CSP, X-Frame-Options, HSTS, X-Content-Type-Options
app.use(helmet());

// ── Cookie parsing ──────────────────────────────────────────────────────────
app.use(cookieParser());

// ── CORS (RNF-11) ───────────────────────────────────────────────────────────
// Solo el origen del frontend está permitido
app.use(
  cors({
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || origin === 'http://localhost:3000' || 
          origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
// Previene abuso y ataques de fuerza bruta
app.use('/api', apiLimiter);

// ── HTTP Caching Headers ─────────────────────────────────────────────────────
// Cache corto para datos estáticos (departamentos, categorías)
app.use('/api/departments', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 min
  }
  next();
});

app.use('/api/categories', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5 min
  }
  next();
});

// No cache para datos dinámicos
app.use('/api/tickets', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-cache');
  }
  next();
});

app.use('/api/users', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'no-cache');
  }
  next();
});

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ──────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`📥 ${req.method} ${req.path}`, { body: req.body });
  next();
});

// ── Health Check ─────────────────────────────────────────────────────────────
// GET /api/health → { status: "ok" }
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Manejo de errores global ─────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message;

  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'El archivo excede el tamaño máximo permitido de 10MB';
  }

  if (statusCode === 401 || statusCode === 403) {
    status = 'fail';
  }

  if (process.env.NODE_ENV === 'production' && !err.isOperational && statusCode === 500) {
    message = 'Ocurrió un error inesperado';
  }

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode !== 413 && { stack: err.stack }),
  });
});



export default app;
