import { DayKey, Language, MarketType } from '../types';
import { DAY_NAMES, getCutAnk } from './matkaMath';

export interface PhotoCardPayload {
  market: MarketType;
  language: Language;
  weekStr: string;
  day: DayKey;
  titleBadge?: string;
  otcDigits: number[];
  strongJodis: string[];
  supportJodis: string[];
  panas: string[];
  formulaLabel: string;
  declaredResult?: string;
  passBanner?: string;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderSharePhotoCard(payload: PhotoCardPayload): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isMr = payload.language === 'mr';
  const isNight = payload.market === 'rajdhani_night';

  const primaryAccent = isNight ? '#818cf8' : '#f59e0b';
  const primaryAccentStrong = isNight ? '#6366f1' : '#d97706';
  const secondaryAccent = isNight ? '#c084fc' : '#fbbf24';
  const dayLabel = DAY_NAMES[payload.day]?.[payload.language] || payload.day;
  const marketTitle = isNight
    ? isMr
      ? 'राजधानी नाईट अंक गणित चार्ट'
      : 'RAJDHANI NIGHT CHART STUDY'
    : isMr
    ? 'कल्याण अंक गणित & जोडी चार्ट'
    : 'KALYAN ANK GANIT & JODI CHART';

  // 1. Deep Studio Canvas Background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#060913');
  bgGrad.addColorStop(0.55, isNight ? '#0f1029' : '#0f172a');
  bgGrad.addColorStop(1, '#050811');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = 60; gx < width; gx += 60) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 60; gy < height; gy += 60) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // Outer Frame Border
  drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 36);
  ctx.strokeStyle = isNight ? 'rgba(99, 102, 241, 0.45)' : 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 2. Top Header Banner
  const headerGrad = ctx.createLinearGradient(68, 68, width - 68, 250);
  headerGrad.addColorStop(0, isNight ? 'rgba(79, 70, 229, 0.28)' : 'rgba(217, 119, 6, 0.25)');
  headerGrad.addColorStop(1, 'rgba(15, 23, 42, 0.88)');
  drawRoundedRect(ctx, 68, 68, width - 136, 188, 28);
  ctx.fillStyle = headerGrad;
  ctx.fill();
  ctx.strokeStyle = isNight ? 'rgba(129, 140, 248, 0.4)' : 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Market Emblem Box
  drawRoundedRect(ctx, 100, 98, 106, 106, 24);
  ctx.fillStyle = primaryAccentStrong;
  ctx.fill();
  ctx.fillStyle = isNight ? '#ffffff' : '#090d16';
  ctx.font = '800 56px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isNight ? 'रा' : 'क', 153, 154);

  // Title & Metadata
  ctx.textAlign = 'left';
  ctx.fillStyle = secondaryAccent;
  ctx.font = '700 24px "Plus Jakarta Sans", "Noto Sans Devanagari", sans-serif';
  ctx.fillText(
    payload.titleBadge || (isMr ? 'पक्के अंक व जोडी अभ्यास कार्ड' : 'SOLID OTC & JODI STUDY CARD'),
    232,
    114
  );

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 44px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(marketTitle, 232, 166);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 26px "JetBrains Mono", "Noto Sans Devanagari", monospace';
  ctx.fillText(`${dayLabel}  ·  ${payload.weekStr}`, 232, 214);

  let currentY = 286;

  // Optional Declared Result / Pass Banner
  if (payload.declaredResult || payload.passBanner) {
    drawRoundedRect(ctx, 68, currentY, width - 136, 96, 22);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '800 32px "JetBrains Mono", "Noto Sans Devanagari", sans-serif';
    const bannerLine = [payload.declaredResult, payload.passBanner].filter(Boolean).join('  —  ');
    ctx.fillText(bannerLine, width / 2, currentY + 50);
    currentY += 122;
  }

  // 3. Section 1: 4 SOLID OTC DIGITS
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 30px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    isMr ? `४ पक्के ओटीसी अंक (Open / Close OTC)` : `TOP 4 SOLID OTC DIGITS`,
    72,
    currentY + 24
  );

  currentY += 50;
  const otcList = payload.otcDigits.slice(0, 4);
  const cardGap = 24;
  const otcWidth = (width - 136 - cardGap * 3) / 4;
  const otcHeight = 230;

  otcList.forEach((digit, idx) => {
    const bx = 68 + idx * (otcWidth + cardGap);
    drawRoundedRect(ctx, bx, currentY, otcWidth, otcHeight, 24);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = primaryAccent;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 20px "Plus Jakarta Sans", "Noto Sans Devanagari", sans-serif';
    ctx.fillText(`#${idx + 1} OTC`, bx + otcWidth / 2, currentY + 36);

    ctx.fillStyle = secondaryAccent;
    ctx.font = '800 98px "JetBrains Mono", monospace';
    ctx.fillText(String(digit), bx + otcWidth / 2, currentY + 124);

    // Cut Ank Footer inside OTC box
    drawRoundedRect(ctx, bx + 20, currentY + otcHeight - 54, otcWidth - 40, 38, 12);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 20px "Noto Sans Devanagari", "JetBrains Mono", sans-serif';
    ctx.fillText(
      `${isMr ? 'कट' : 'Cut'}: ${getCutAnk(digit)}`,
      bx + otcWidth / 2,
      currentY + otcHeight - 34
    );
  });

  currentY += otcHeight + 42;

  // 4. Section 2: Strong Jodis & Support Jodis Side-by-Side or Stacked
  const drawJodiRow = (
    label: string,
    jodis: string[],
    accentBorder: string,
    textColor: string,
    startY: number
  ) => {
    drawRoundedRect(ctx, 68, startY, width - 136, 196, 24);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '700 27px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(label, 96, startY + 42);

    const items = jodis.slice(0, 4);
    const jGap = 22;
    const jW = (width - 192 - jGap * 3) / 4;
    items.forEach((jodi, idx) => {
      const jx = 96 + idx * (jW + jGap);
      const jy = startY + 72;
      drawRoundedRect(ctx, jx, jy, jW, 98, 18);
      ctx.fillStyle = '#020617';
      ctx.fill();
      ctx.strokeStyle = accentBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.font = '800 52px "JetBrains Mono", monospace';
      ctx.fillText(jodi, jx + jW / 2, jy + 53);
    });
  };

  drawJodiRow(
    isMr ? '४ पक्की जोडी (Strong Jodis)' : '4 STRONG JODIS',
    payload.strongJodis.length > 0 ? payload.strongJodis : ['--', '--', '--', '--'],
    primaryAccent,
    secondaryAccent,
    currentY
  );

  currentY += 220;

  if (payload.supportJodis.length > 0) {
    drawJodiRow(
      isMr ? '४ सपोर्ट जोडी (Support Jodis)' : '4 SUPPORT JODIS',
      payload.supportJodis,
      'rgba(34, 211, 238, 0.5)',
      '#67e8f9',
      currentY
    );
    currentY += 220;
  }

  // 5. Selected Panas Strip
  if (payload.panas.length > 0 && currentY + 130 < height - 110) {
    drawRoundedRect(ctx, 68, currentY, width - 136, 118, 22);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 23px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
    ctx.fillText(isMr ? 'निवडक पाना (Pana / Patti):' : 'SELECTED PANAS:', 96, currentY + 40);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 32px "JetBrains Mono", monospace';
    ctx.fillText(payload.panas.slice(0, 8).join('   ·   '), 96, currentY + 86);
  }

  // 6. Footer Formula & Study Attribution
  ctx.textAlign = 'center';
  ctx.fillStyle = primaryAccent;
  ctx.font = '700 23px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `${isMr ? 'सूत्र' : 'Formula'}: ${payload.formulaLabel}`,
    width / 2,
    height - 102
  );

  ctx.fillStyle = '#64748b';
  ctx.font = '500 19px "Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    isMr
      ? 'केवळ शैक्षणिक आणि संख्याशास्त्रीय चार्ट अभ्यासासाठी · कल्याण व राजधानी नाईट स्मार्ट चार्ट सूट'
      : 'For Educational Combinatorics & Historical Chart Study Only',
    width / 2,
    height - 66
  );

  return canvas.toDataURL('image/png', 1.0);
}

export async function dataUrlToPngFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: 'image/png' });
}
