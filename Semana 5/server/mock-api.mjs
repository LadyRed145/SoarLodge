import { createServer } from 'node:http';
import { createHandler } from './handler.mjs';

const port = Number(process.env.PORT || process.env.MOCK_PORT || 4174);
const host = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
const allowedOrigin = (process.env.ALLOWED_ORIGIN || '').replace(/\/+$/, '');
const handler = createHandler();

const server = createServer((request, response) => {
  // Solo el frontend publicado recibe permiso de CORS (origen, no ruta).
  if (allowedOrigin && request.headers.origin === allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Accept, Content-Type');
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(allowedOrigin && request.headers.origin === allowedOrigin ? 204 : 403);
    response.end();
    return;
  }
  void handler(request, response);
});

server.listen(port, host, () => {
  console.log(`[Soarlodge mock REST+GraphQL] http://${host}:${port}/api/health · /graphql`);
});
server.on('error', (error) => {
  console.error('[Soarlodge mock] No se pudo iniciar:', error.message);
  process.exitCode = 1;
});
