// server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve the static HTML from /public at /
app.use(express.static(path.join(__dirname, 'public')));

// Minimal SSE endpoint: /events
app.get('/events', (req, res) => {
  // Required SSE headers
  res.setHeader('Content-Type', 'text/event-stream'); // tells browser this is SSE
  res.setHeader('Cache-Control', 'no-cache');          // avoid buffering by caches

  // Optional initial comment (harmless, often useful with intermediaries)
  res.write(': connected\n\n');

  let i = 0;
  const timer = setInterval(() => {
    const payload = { i, ts: Date.now() };
    // An SSE message = one or more `data:` lines, then a blank line
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    i++;
  }, 1000);

  // Cleanup when client disconnects
  req.on('close', () => {
    clearInterval(timer);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Basic SSE running at http://localhost:${PORT}`);
});
