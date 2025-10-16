// server.js (CommonJS)
const express = require('express');
const path = require('path');

const app = express();

// Serve static files from ./public (index.html at /)
app.use(express.static(path.join(__dirname, 'public')));

// SSE log stream with optional severity filter: /logs?level=info|warn|error|debug
app.get('/logs', (req, res) => {
  // Required SSE headers
  res.setHeader('Content-Type', 'text/event-stream'); // parse as SSE
  res.setHeader('Cache-Control', 'no-cache');          // avoid buffering
  res.setHeader('Connection', 'keep-alive');           // keep TCP open (helpful)

  // Severity ordering for filtering
  const levels = ['debug', 'info', 'warn', 'error'];
  const min = (req.query.level || 'info').toString();

  let i = 0;
  // Emit a new log record every ~700ms, rotating levels
  const t = setInterval(() => {
    const level = levels[i++ % levels.length];
    const record = { ts: Date.now(), level, msg: `event ${i}` };

    // Only stream records meeting the minimum level threshold
    if (levels.indexOf(level) >= levels.indexOf(min)) {
      // SSE frame: one or more data: lines, then a blank line terminator
      res.write(`data: ${JSON.stringify(record)}\n\n`);
    }
  }, 700);

  // Heartbeat comment to keep intermediaries from timing out idle streams
  const hb = setInterval(() => res.write(': ping\n\n'), 20000);

  // Cleanup when client disconnects
  req.on('close', () => {
    clearInterval(t);
    clearInterval(hb);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SSE logs demo at http://localhost:${PORT}`);
});
