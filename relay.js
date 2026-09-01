#!/usr/bin/env node
// Boids Lab relay — static file server + WebSocket message relay, one process,
// zero dependencies. This is the cross-device transport for the instrument:
// the model on a big screen, the tablet in the instructor's hands.
//
//   node relay.js            (port 8014, or PORT=xxxx)
//
// WebSocket rooms live at ws://<host>/ws/<room>. The relay is dumb on
// purpose: it forwards every message to every *other* socket in the same
// room and understands nothing about the protocol. The model stays the
// single source of truth (docs/instrument-protocol.md).

'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.env.PORT, 10) || 8014;
const ROOT = __dirname;
const MAX_MSG = 64 * 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

// ---- static files ---------------------------------------------------------
const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT + path.sep) && file !== ROOT) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

// ---- websocket relay ------------------------------------------------------
const rooms = new Map();   // room name -> Set<socket>

function encodeFrame(payload, op) {
  const len = payload.length;
  let head;
  if (len < 126) { head = Buffer.from([0x80 | op, len]); }
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | op; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, payload]);
}

function readFrame(buf) {
  if (buf.length < 2) return null;
  const fin = !!(buf[0] & 0x80), op = buf[0] & 0x0f;
  const masked = !!(buf[1] & 0x80);
  let len = buf[1] & 0x7f, off = 2;
  if (len === 126) { if (buf.length < 4) return null; len = buf.readUInt16BE(2); off = 4; }
  else if (len === 127) {
    if (buf.length < 10) return null;
    const big = buf.readBigUInt64BE(2);
    if (big > BigInt(MAX_MSG)) throw new Error('frame too large');
    len = Number(big); off = 10;
  }
  if (len > MAX_MSG) throw new Error('frame too large');
  const total = off + (masked ? 4 : 0) + len;
  if (buf.length < total) return null;
  let payload;
  if (masked) {
    const mask = buf.subarray(off, off + 4);
    payload = Buffer.from(buf.subarray(off + 4, total));
    for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
  } else {
    payload = buf.subarray(off, total);
  }
  return { fin, op, payload, rest: buf.subarray(total) };
}

server.on('upgrade', (req, sock) => {
  const m = /^\/ws\/([\w-]{1,32})$/.exec(req.url);
  const key = req.headers['sec-websocket-key'];
  if (!m || !key) { sock.destroy(); return; }
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\n' +
             'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
             'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  const room = m[1];
  if (!rooms.has(room)) rooms.set(room, new Set());
  const peers = rooms.get(room);
  peers.add(sock);
  sock.setNoDelay(true);

  let buf = Buffer.alloc(0);
  let frag = null;   // {op, parts} while a fragmented message is in flight
  const deliver = (op, payload) => {
    const out = encodeFrame(payload, op);
    for (const p of peers) if (p !== sock && !p.destroyed) p.write(out);
  };
  sock.on('data', d => {
    buf = buf.length ? Buffer.concat([buf, d]) : d;
    try {
      let f;
      while ((f = readFrame(buf))) {
        buf = f.rest;
        if (f.op === 8) { sock.end(); return; }
        else if (f.op === 9) { sock.write(encodeFrame(f.payload, 10)); }
        else if (f.op === 10) { /* pong */ }
        else if (f.op === 1 || f.op === 2) {
          if (f.fin) deliver(f.op, f.payload);
          else frag = { op: f.op, parts: [f.payload] };
        }
        else if (f.op === 0) {
          if (!frag) throw new Error('stray continuation');
          frag.parts.push(f.payload);
          if (f.fin) { deliver(frag.op, Buffer.concat(frag.parts)); frag = null; }
        }
      }
    } catch (e) { sock.destroy(); }
  });
  const bye = () => { peers.delete(sock); if (!peers.size) rooms.delete(room); };
  sock.on('close', bye);
  sock.on('error', bye);
});

// ---- go -------------------------------------------------------------------
server.listen(PORT, () => {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list) if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
  console.log('boids-lab relay listening on port ' + PORT);
  const host = ips[0] || 'localhost';
  console.log('  big screen : http://' + host + ':' + PORT + '/model.html?room=class');
  console.log('  tablet     : http://' + host + ':' + PORT + '/tablet.html?room=class');
  console.log('  phone      : http://' + host + ':' + PORT + '/remote.html?room=class');
  if (ips.length > 1) console.log('  (other addresses: ' + ips.slice(1).join(', ') + ')');
});
