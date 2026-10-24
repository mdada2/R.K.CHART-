import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Minimal deterministic PNG encoder (RGBA 8-bit) using built-in node:zlib
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width: number, height: number, pixels: Uint8Array): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(
      raw,
      y * stride + 1
    );
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderBrandIcon(size: number, maskable: boolean): Buffer {
  const pixels = new Uint8Array(size * size * 4);
  const pad = maskable ? size * 0.16 : size * 0.08;
  const cornerRadius = maskable ? 0 : size * 0.22;

  const inRoundedRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number, r: number) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    if (r <= 0) return true;
    const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x;
    const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (!maskable && !inRoundedRect(x + 0.5, y + 0.5, 0, 0, size, size, cornerRadius)) {
        pixels[idx + 3] = 0;
        continue;
      }

      // Rich deep slate background gradient (#0B1120 -> #1E1B4B)
      const t = (x + y) / (2 * size);
      let r = Math.round(11 * (1 - t) + 23 * t);
      let g = Math.round(17 * (1 - t) + 25 * t);
      let b = Math.round(32 * (1 - t) + 58 * t);

      // Subtle inner gold border frame inside safe zone
      const innerMin = pad;
      const innerMax = size - pad;
      const frameR = size * 0.14;
      const inOuterFrame = inRoundedRect(x + 0.5, y + 0.5, innerMin, innerMin, innerMax, innerMax, frameR);
      const borderT = Math.max(2, size * 0.022);
      const inInnerBg = inRoundedRect(
        x + 0.5,
        y + 0.5,
        innerMin + borderT,
        innerMin + borderT,
        innerMax - borderT,
        innerMax - borderT,
        Math.max(0, frameR - borderT)
      );

      if (inOuterFrame && !inInnerBg) {
        // Warm gold frame (#F59E0B)
        r = 245;
        g = 158;
        b = 11;
      } else if (inInnerBg) {
        // Draw stylized 2x2 Ank Ganit Chart Matrix + Gold Diamond center inside safe zone
        const cx = size / 2;
        const cy = size / 2;
        const boxSpan = (innerMax - innerMin) * 0.56;
        const half = boxSpan / 2;
        const gap = Math.max(2, size * 0.025);

        const inTopLeft =
          inRoundedRect(x, y, cx - half, cy - half, cx - gap, cy - gap, size * 0.04);
        const inTopRight =
          inRoundedRect(x, y, cx + gap, cy - half, cx + half, cy - gap, size * 0.04);
        const inBotLeft =
          inRoundedRect(x, y, cx - half, cy + gap, cx - gap, cy + half, size * 0.04);
        const inBotRight =
          inRoundedRect(x, y, cx + gap, cy + gap, cx + half, cy + half, size * 0.04);

        // Center diamond accent
        const diamondDist = Math.abs(x - cx) + Math.abs(y - cy);
        const isDiamond = diamondDist <= size * 0.095;

        if (isDiamond) {
          r = 251;
          g = 191;
          b = 36; // #FBBF24 bright gold
        } else if (inTopLeft || inBotRight) {
          // Gold Kalyan tiles
          r = 245;
          g = 158;
          b = 11;
        } else if (inTopRight || inBotLeft) {
          // Indigo Rajdhani Night tiles
          r = 99;
          g = 102;
          b = 241; // #6366F1
        }
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = 255;
    }
  }

  return encodePNG(size, size, pixels);
}

const publicDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(publicDir, { recursive: true });

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderBrandIcon(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderBrandIcon(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderBrandIcon(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderBrandIcon(180, true));

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <rect x="44" y="44" width="424" height="424" rx="84" fill="none" stroke="url(#gold)" stroke-width="12"/>
  <rect x="116" y="116" width="124" height="124" rx="24" fill="url(#gold)"/>
  <rect x="272" y="116" width="124" height="124" rx="24" fill="#6366f1"/>
  <rect x="116" y="272" width="124" height="124" rx="24" fill="#6366f1"/>
  <rect x="272" y="272" width="124" height="124" rx="24" fill="url(#gold)"/>
  <polygon points="256,204 308,256 256,308 204,256" fill="#fef3c7" stroke="#0b1120" stroke-width="10"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('Generated PWA icons successfully in public/');
