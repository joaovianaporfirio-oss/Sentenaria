import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// CRC32 table for PNG encoding
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    rawData[rowStart] = 0; // filter type 0
    rgba.copy(rawData, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Signed distance to a rounded rectangle centered at (cx, cy) with half-size (hx, hy) and corner radius r
function sdRoundRect(x, y, cx, cy, hx, hy, r) {
  const dx = Math.abs(x - cx) - (hx - r);
  const dy = Math.abs(y - cy) - (hy - r);
  const outDist = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inDist = Math.min(Math.max(dx, dy), 0);
  return outDist + inDist - r;
}

// Signed distance to a line segment (x1,y1)-(x2,y2)
function sdSegment(px, py, x1, y1, x2, y2) {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const h = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  return Math.hypot(wx - vx * h, wy - vy * h);
}

/**
 * Evaluates the color [r, g, b, a] at normalized coordinate (nx, ny) in [0..128, 0..128]
 */
function sampleSentenariaIcon(nx, ny) {
  const dBoardInner = sdRoundRect(nx, ny, 64, 60, 49, 47, 21);
  const dWhitePaper = sdRoundRect(nx, ny, 64, 60, 54, 52, 25);
  const dOuterStroke = sdRoundRect(nx, ny, 64, 60, 57, 55, 27);
  const dBaseLip = sdRoundRect(nx, ny, 64, 68, 57, 55, 27);

  if (dBoardInner <= 0) {
    // Inside dark board surface
    let r = 26,
      g = 33,
      b = 54;

    // 3x3 Grid cells
    const cells = [
      { cx: 33, cy: 30, center: false },
      { cx: 64, cy: 30, center: false },
      { cx: 95, cy: 30, center: false },
      { cx: 33, cy: 60, center: false },
      { cx: 64, cy: 60, center: true },
      { cx: 95, cy: 60, center: false },
      { cx: 33, cy: 90, center: false },
      { cx: 64, cy: 90, center: false },
      { cx: 95, cy: 90, center: false },
    ];

    for (const cell of cells) {
      const dCell = sdRoundRect(nx, ny, cell.cx, cell.cy, 12.5, 11.5, 5);
      if (dCell <= 0) {
        if (cell.center) {
          if (dCell > -2.5) {
            r = 251;
            g = 191;
            b = 36; // Golden border of 3x3 center
          } else {
            r = 59;
            g = 53;
            b = 38;
          }
        } else {
          r = 39;
          g = 48;
          b = 76;
        }
      }
    }

    // Blue Tokens at Top-Right (95, 30) and Bottom-Left (33, 90)
    const dBlue1 = Math.hypot(nx - 95, ny - 30);
    const dBlue2 = Math.hypot(nx - 33, ny - 90);
    const dBlue = Math.min(dBlue1, dBlue2);
    if (dBlue <= 12) {
      if (dBlue <= 3.3) {
        return [255, 255, 255, 255];
      }
      if (dBlue <= 8.5) {
        return [28, 176, 246, 255]; // #1CB0F6 Sky Blue
      }
      return [255, 255, 255, 255]; // White paper cutout border
    }

    // Diagonal Trinca Beam (33,30) -> (64,60) -> (95,90)
    const dSeg = sdSegment(nx, ny, 33, 30, 95, 90);
    const dNode1 = Math.hypot(nx - 33, ny - 30);
    const dNode2 = Math.hypot(nx - 64, ny - 60);
    const dNode3 = Math.hypot(nx - 95, ny - 90);

    // Center Star Sparkle
    if (dNode2 <= 4.2 || dNode1 <= 3.5 || dNode3 <= 3.5) {
      if (dNode2 <= 4.2) return [253, 224, 71, 255]; // Gold center dot
      return [255, 255, 255, 255];
    }

    // Red Trinca Core
    if (
      dSeg <= 5.2 ||
      dNode1 <= 9.2 ||
      dNode2 <= 10.2 ||
      dNode3 <= 9.2
    ) {
      return [255, 75, 75, 255]; // #FF4B4B Coral Red
    }

    // White Paper Cutout Rim around Trinca
    if (
      dSeg <= 9.2 ||
      dNode1 <= 13.0 ||
      dNode2 <= 14.0 ||
      dNode3 <= 13.0
    ) {
      return [255, 255, 255, 255];
    }

    return [r, g, b, 255];
  }

  if (dWhitePaper <= 0) {
    return [255, 255, 255, 255];
  }

  if (dOuterStroke <= 0 || dBaseLip <= 0) {
    return [15, 20, 34, 255];
  }

  return [0, 0, 0, 0];
}

function renderIconRGBA(size) {
  const buf = Buffer.alloc(size * size * 4);
  const samples = 4; // 4x4 supersampling for crisp anti-aliasing
  const scale = 128 / size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        aSum = 0;

      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const nx = (x + (sx + 0.5) / samples) * scale;
          const ny = (y + (sy + 0.5) / samples) * scale;
          const [r, g, b, a] = sampleSentenariaIcon(nx, ny);
          const alphaWeight = a / 255;
          rSum += r * alphaWeight;
          gSum += g * alphaWeight;
          bSum += b * alphaWeight;
          aSum += a;
        }
      }

      const totalSamples = samples * samples;
      const finalA = Math.round(aSum / totalSamples);
      const idx = (y * size + x) * 4;
      if (finalA > 0) {
        const weightSum = aSum / 255;
        buf[idx] = Math.min(255, Math.round(rSum / weightSum));
        buf[idx + 1] = Math.min(255, Math.round(gSum / weightSum));
        buf[idx + 2] = Math.min(255, Math.round(bSum / weightSum));
        buf[idx + 3] = finalA;
      }
    }
  }
  return buf;
}

/**
 * Packs multiple PNG buffers (e.g. 16x16, 32x32, 48x48) into a standard Windows .ico file
 */
function encodeICO(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  let dataOffset = 6 + count * 16;

  for (const { size, png } of entries) {
    const dir = Buffer.alloc(16);
    dir[0] = size >= 256 ? 0 : size; // width
    dir[1] = size >= 256 ? 0 : size; // height
    dir[2] = 0; // color palette
    dir[3] = 0; // reserved
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bits per pixel
    dir.writeUInt32LE(png.length, 8); // image byte size
    dir.writeUInt32LE(dataOffset, 12); // offset
    dirEntries.push(dir);
    dataOffset += png.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...entries.map((e) => e.png),
  ]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const png16 = encodePNG(16, 16, renderIconRGBA(16));
const png32 = encodePNG(32, 32, renderIconRGBA(32));
const png48 = encodePNG(48, 48, renderIconRGBA(48));
const png180 = encodePNG(180, 180, renderIconRGBA(180));

const icoBuffer = encodeICO([
  { size: 16, png: png16 },
  { size: 32, png: png32 },
  { size: 48, png: png48 },
]);

fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);
fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

console.log('Generated favicon.ico, favicon-16x16.png, favicon-32x32.png, and apple-touch-icon.png successfully!');
