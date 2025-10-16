import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, 'public')));


app.get('/progress/:jobId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const jobId = req.params.jobId;
  let pct = 0;

  const t = setInterval(() => {
    pct += 5;

    res.write('event: progress\n');
    res.write(`data: ${JSON.stringify({ jobId, pct })}\n\n`);

    if (pct >= 100) {
      res.write('event: done\n');
      res.write(`data: ${JSON.stringify({ jobId })}\n\n`);
      clearInterval(t);
      res.end();
    }
  }, 500);

  req.on('close', () => clearInterval(t));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SSE progress demo at http://localhost:${PORT}`);
});
