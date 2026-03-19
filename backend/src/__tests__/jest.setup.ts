import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno de prueba antes de que se importe cualquier otro módulo
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Silenciar logs de Winston durante los tests para limpieza
process.env.LOG_LEVEL = 'error';
