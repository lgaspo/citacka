/* HTML Čítačka – Service Worker
   Pri každej zmene súborov čítačky zvýš VERSION, aby si zariadenia stiahli novú verziu. */
const VERSION = 'citacka-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './fflate.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const DB_NAME = 'citacka';
const DB_VER = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('packages')) db.createObjectStore('packages', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'key' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function idbGet(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, 'readonly');
    const q = t.objectStore(store).get(key);
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
  });
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const base = new URL(self.registration.scope).pathname; // napr. /citacka/
  if (url.pathname.startsWith(base + 'pkg/')) {
    e.respondWith(servePackageFile(req, url, base));
    return;
  }
  // Appka: najprv z cache (offline), potom zo siete
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).catch(() =>
      req.mode === 'navigate' ? caches.match('./index.html') : Response.error()
    ))
  );
});

/* Skript vložený do každej HTML stránky balíka:
   odkazy target=_blank v rámci balíka otvorí v čítačke, nie v Safari
   (Safari nemá prístup k úložisku nainštalovanej appky). */
const INJECT = `<script>(function(){
document.addEventListener('click',function(e){
 var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
 if(!a)return;
 try{var u=new URL(a.href,location.href);
  if(u.origin===location.origin&&(a.target==='_blank'||a.target==='_top'||a.target==='_parent')){a.target='_self';}
 }catch(_){}
},true);
var wo=window.open;
window.open=function(u,n,f){try{var x=new URL(u,location.href);if(x.origin===location.origin){location.href=x.href;return window;}}catch(_){}return wo.apply(window,arguments);};
})();</script>`;

async function servePackageFile(req, url, base) {
  let rest;
  try { rest = decodeURIComponent(url.pathname.slice(base.length + 4)); }
  catch (_) { rest = url.pathname.slice(base.length + 4); }
  rest = rest.normalize('NFC');
  const slash = rest.indexOf('/');
  const id = slash === -1 ? rest : rest.slice(0, slash);
  let path = slash === -1 ? '' : rest.slice(slash + 1);
  if (path === '' || path.endsWith('/')) path += 'index.html';

  let rec = await idbGet('files', id + '/' + path);
  if (!rec) {
    // náhradné hľadanie: iná veľkosť písmen, priečinok bez lomky
    const meta = await idbGet('packages', id);
    if (meta && meta.files) {
      const lower = path.toLowerCase();
      const cands = [lower, lower + '/index.html', lower + '/index.htm'];
      const hit = meta.files.find(f => cands.includes(f.toLowerCase()));
      if (hit) rec = await idbGet('files', id + '/' + hit);
    }
  }
  if (!rec) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
       <body style="font-family:-apple-system,sans-serif;padding:2rem;color:#333">
       <h2>Súbor sa v balíku nenašiel</h2><p><code>${escapeHtml(path)}</code></p>
       <p>Skontroluj, či odkaz v HTML zodpovedá názvu súboru v ZIP-e (aj veľké a malé písmená, diakritiku).</p></body>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const type = rec.type || 'application/octet-stream';
  let data = rec.data;

  if (/^text\/html/.test(type)) {
    let html = new TextDecoder('utf-8').decode(data);
    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, m => m + INJECT)
      : INJECT + html;
    return new Response(html, { headers: { 'Content-Type': type, 'Cache-Control': 'no-store' } });
  }

  // Podpora Range (potrebné pre video a audio v Safari)
  const range = req.headers.get('Range');
  const size = data.byteLength;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      let start = m[1] === '' ? size - Number(m[2]) : Number(m[1]);
      let end = m[1] !== '' && m[2] !== '' ? Number(m[2]) : size - 1;
      start = Math.max(0, start); end = Math.min(size - 1, end);
      if (start <= end) {
        return new Response(data.slice(start, end + 1), {
          status: 206,
          headers: {
            'Content-Type': type,
            'Content-Range': `bytes ${start}-${end}/${size}`,
            'Content-Length': String(end - start + 1),
            'Accept-Ranges': 'bytes'
          }
        });
      }
    }
  }
  return new Response(data, {
    headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
