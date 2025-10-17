const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const COUNTER_FILE = path.join(__dirname, 'event-counter.txt');


function loadEventCounter() {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const val = fs.readFileSync(COUNTER_FILE, 'utf8').trim();
      const num = parseInt(val, 10);
      if (!isNaN(num)) return num;
    }
  } catch {}
  return 0;
}
function saveEventCounter(n) {
  try { fs.writeFileSync(COUNTER_FILE, n.toString(), 'utf8'); }
  catch (e) { console.error('Save counter error', e); }
}


function makeRingBuffer(size = 200) {
  const buf = new Array(size);
  let head = 0, maxId = 0;
  return {
    push(data, id) {
      const item = { id, data };
      buf[head] = item;
      head = (head + 1) % size;
      maxId = Math.max(maxId, id);
      return item;
    },
    replayFrom(lastId, writer) {
      const items = [];
      buf.forEach(it => { if (it && it.id > lastId) items.push(it); });
      items.sort((a,b)=>a.id-b.id);
      items.forEach(writer);
    }
  };
}

const logBuffer = makeRingBuffer(300);
let globalEventCounter = loadEventCounter();


app.use(express.static(path.join(__dirname, 'public')));

app.get('/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 3000\n\n');

  const levels = ['debug','info','warn','error'];
  const min = (req.query.level||'info').toString();
  const lastId = Number(req.get('Last-Event-ID')||0);



  logBuffer.replayFrom(lastId, item => {
    res.write(`id: ${item.id}\n`);
    res.write(`data: ${JSON.stringify(item.data)}\n\n`);
  });


  const hb = setInterval(() => res.write(': ping\n\n'),20000);


  const live = setInterval(() => {
    globalEventCounter++;
    const lvl = levels[(globalEventCounter-1)%levels.length];
    const rec = { ts: Date.now(), level:lvl, msg:`event ${globalEventCounter}` };
    const item = logBuffer.push(rec, globalEventCounter);
    if (levels.indexOf(lvl)>=levels.indexOf(min)) {
      res.write(`id: ${item.id}\n`);
      res.write(`data: ${JSON.stringify(rec)}\n\n`);
    }
    if (globalEventCounter%10===0) saveEventCounter(globalEventCounter);
  },700);

  req.on('close',()=>{
    clearInterval(hb);
    clearInterval(live);
    saveEventCounter(globalEventCounter);
    console.log('Client disconnected');
  });
});


process.on('SIGINT',()=>{
  saveEventCounter(globalEventCounter);
  process.exit();
});
process.on('SIGTERM',()=>{
  saveEventCounter(globalEventCounter);
  process.exit();
});

const PORT=3000;
app.listen(PORT,()=> console.log(`Listening on http://localhost:${PORT}`));
