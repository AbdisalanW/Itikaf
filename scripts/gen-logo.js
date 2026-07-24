// Dependency-free logo generator: a crescent moon + single star mark on a
// terracotta gradient, matching the app's --accent/--accent2 palette.
// Pure pixel math (no canvas/Sharp/ImageMagick needed) — same PNG-writing
// approach as gen-icon.js, extended with simple shape fills.
const zlib = require('zlib');
const fs = require('fs');

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp(a, b, t) { return a + (b - a) * t; }

function makeLogo(size, outPath) {
  const bgA = hex('#E08D4B'), bgB = hex('#C96A3B');
  const cream = hex('#FBF3E7');
  const bite = hex('#D07A3E');

  const px = new Array(size * size);
  const cx = size * 0.5, cy = size * 0.5, r = size * 0.30;
  const biteCx = cx + r * 0.62, biteCy = cy - r * 0.28, biteR = r * 0.86;
  const starCx = size * 0.22, starCy = size * 0.18, starR = size * 0.05;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size); // diagonal gradient
      let color = [lerp(bgA[0], bgB[0], t), lerp(bgA[1], bgB[1], t), lerp(bgA[2], bgB[2], t)];

      const dMoon = Math.hypot(x - cx, y - cy);
      if (dMoon <= r) color = cream;

      const dBite = Math.hypot(x - biteCx, y - biteCy);
      if (dBite <= biteR) color = dMoon <= r ? bite : color;

      // 4-pointed star (diamond via Chebyshev/Manhattan blend for a soft point look)
      const dx = Math.abs(x - starCx), dy = Math.abs(y - starCy);
      if (dx + dy <= starR) color = cream;

      px[y * size + x] = color;
    }
  }

  const rowLen = size * 3;
  const raw = Buffer.alloc((rowLen + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowLen + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const c = px[y * size + x];
      const off = rowStart + 1 + x * 3;
      raw[off] = Math.round(c[0]); raw[off + 1] = Math.round(c[1]); raw[off + 2] = Math.round(c[2]);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8); ihdr.writeUInt8(2, 9); ihdr.writeUInt8(0, 10); ihdr.writeUInt8(0, 11); ihdr.writeUInt8(0, 12);

  const idat = zlib.deflateSync(raw);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${size}x${size})`);
}

const size = parseInt(process.argv[2], 10);
const outPath = process.argv[3];
makeLogo(size, outPath);
