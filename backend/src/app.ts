// ============================================================================
// Helpify — Express Application Setup
// Configura middleware de seguridad, CORS, parsing y rutas
// ============================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ── Seguridad (RNF-10) ──────────────────────────────────────────────────────
// Helmet configura: CSP, X-Frame-Options, HSTS, X-Content-Type-Options
app.use(helmet());

// ── CORS (RNF-11) ───────────────────────────────────────────────────────────
// Solo el origen del frontend está permitido
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────────────────
// GET /api/health → { status: "ok" }
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

import apiRouter from './routes';
import { AppError } from './middlewares/error.middleware';

// ── Rutas de la API ──────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Manejo de errores global ─────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  const message = process.env.NODE_ENV === 'production' && !err.isOperational 
    ? 'Ocurrió un error inesperado' 
    : err.message;

  res.status(statusCode).json({
    status,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});



export default app;
