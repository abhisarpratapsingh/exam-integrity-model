/**
 * scripts/serve.js
 *
 * A tiny, dependency-free static file server for viewing the demo
 * locally. Serves the repository root on http://localhost:8080 so that
 * demo/index.html can load ../src/*.js correctly.
 *
 * Why this exists instead of "just open the HTML file": opening
 * demo/index.html directly (file://) works fine here, since the
 * src/*.js files are loaded as plain <script src> tags, not ES modules,
 * so there is no CORS restriction to work around. This server is
 * provided anyway for convenience and because GitHub Pages, the
 * deployment target, serves over HTTP(S) too, so this is a closer match
 * to how the page will actually be hosted.
 *
 * Usage: node scripts/serve.js [port]
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.argv[2]) || 8080;
const root = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/demo/index.html';

  const filePath = path.join(root, reqPath);

  // prevent path traversal outside the repo root
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log('Serving ' + root);
  console.log('Demo: http://localhost:' + port + '/demo/index.html');
  console.log('Press Ctrl+C to stop.');
});
