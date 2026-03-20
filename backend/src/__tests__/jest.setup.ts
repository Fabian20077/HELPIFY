const originalLog = console.log;
console.log = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith('[dotenv@')) return;
  originalLog.apply(console, args as Parameters<typeof originalLog>);
};

import dotenv from 'dotenv';
import path from 'path';

process.env.DOTENV_TIPS = 'false';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

process.env.LOG_LEVEL = 'error';
