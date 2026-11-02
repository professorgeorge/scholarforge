import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fundingMiddleware } from '../server/fundingProxy.ts';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4173);
const host = process.env.SCHOLARFORGE_HOST || '127.0.0.1';
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.pdf': 'application/pdf', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  void fundingMiddleware(req, res, () => { void (async () => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    try {
      const path = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
      let file = resolve(root, `.${path}`);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
      try { if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html'); }
      catch { if (extname(path)) { res.writeHead(404); res.end('File not found.'); return; } file = resolve(root, 'index.html'); }
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': `${mime[extname(file)] || 'application/octet-stream'}`, 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end('Build ScholarForge with npm run build before starting this server.'); }
  })(); });
});
server.listen(port, host, () => console.log(`ScholarForge with funding connectors: http://${host}:${port}/`));
