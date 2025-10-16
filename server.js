import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));


app.get('/events', (req, res) => {

  res.setHeader('Content-Type', 'text/event-stream'); // tells browser this is SSE
  res.setHeader('Cache-Control', 'no-cache');          // avoid buffering by caches

  // Optional 
  res.write(': connected\n\n');

  let i = 0;
  const timer = setInterval(() => {
    const payload = { i, ts: Date.now() };

    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    i++;
  }, 1000);


  req.on('close', () => {
    clearInterval(timer);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Basic SSE running at http://localhost:${PORT}`);
});
