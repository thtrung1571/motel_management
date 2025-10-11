const express = require('express');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // If you need to expose a health check or custom routes, add them here.
  server.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
  });

  server.all('*', (req, res) => handle(req, res));

  server.listen(port, (err) => {
    if (err) {
      throw err;
    }
    console.log(`> 🚀 tracuu lookup ready on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start Next.js server', err);
  process.exit(1);
});
