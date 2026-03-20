import { createServer } from 'node:http';
import app from './app';

const server = createServer(app);

module.exports = server;
