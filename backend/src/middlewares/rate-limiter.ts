import rateLimit from 'express-rate-limit';

/**
 * Rate limiter general para todas las rutas del API
 * Previene abuso y ataques de fuerza bruta
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 requests por ventana
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  message: {
    status: 'error',
    message: 'Demasiadas solicitudes desde esta IP. Por favor intenta de nuevo más tarde.',
  },
});

/**
 * Rate limiter estricto para rutas de autenticación
 * Previene ataques de fuerza bruta en login/registro
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada IP a 10 intentos de login por ventana
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No cuenta requests exitosos
  message: {
    status: 'error',
    message: 'Demasiados intentos de autenticación. Por favor intenta de nuevo en 15 minutos.',
  },
});

/**
 * Rate limiter para subida de archivos
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30, // 30 subidas por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Demasiadas subidas de archivos. Por favor intenta de nuevo más tarde.',
  },
});
