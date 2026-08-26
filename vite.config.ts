import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function scholarProxyPlugin(): Plugin {
  return {
    name: 'scholar-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/scholar-profile')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const userId = urlObj.searchParams.get('user');
          const cstart = urlObj.searchParams.get('cstart') || '0';
          const pagesize = urlObj.searchParams.get('pagesize') || '100';
          if (!userId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing user param' }));
            return;
          }

          try {
            const targetUrl = `https://scholar.google.com/citations?user=${encodeURIComponent(userId)}&hl=en&cstart=${encodeURIComponent(cstart)}&pagesize=${encodeURIComponent(pagesize)}`;
            const gRes = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
              },
            });

            if (!gRes.ok) {
              res.statusCode = gRes.status;
              res.end(JSON.stringify({ error: `Google Scholar returned status ${gRes.status}` }));
              return;
            }

            const html = await gRes.text();
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            res.end(html);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    scholarProxyPlugin(),
  ],
})
