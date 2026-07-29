import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument, StandardFonts, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { CandidateRow } from './db';
import { parseAnswers, resultFor } from './sitting';
import { DOMAINS, bankFor } from './questions';

/**
 * Candidate-facing submission receipt.
 *
 * Discloses — by deliberate product decision — the final score, the
 * sub-domain profile and a question-level review with correct answers and
 * rationales, so candidates can audit their own performance. Note the
 * consequence: every receipt carries the answer key for the current item
 * bank, so refresh the bank periodically (see README, "Assessment
 * integrity"). The tier/band and hiring recommendation remain HR-only.
 *
 * Typeset in Plus Jakarta Sans (the app's global font), embedded from
 * src/assets/fonts. Falls back to Helvetica if the files are missing.
 */

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;

const INK = rgb(0.08, 0.09, 0.12);
const MUTED = rgb(0.36, 0.4, 0.45);
const LINE = rgb(0.87, 0.89, 0.91);
const ACCENT = rgb(0.12, 0.31, 0.47);
const GREEN = rgb(0.1, 0.5, 0.29);
const RED = rgb(0.7, 0.15, 0.12);
const BAR_BG = rgb(0.93, 0.94, 0.95);

/** Short human-quotable reference for support queries. Not a secret. */
export function referenceCode(c: CandidateRow): string {
  return c.id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

function fmt(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** pdf-lib's WinAnsi encoding throws on characters outside its range. */
function safe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[→⟶⇒]/g, '->')
    .replace(/[•◦]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

/** Greedy word-wrap measured in the actual font. Splits before sanitising so
 *  embedded newlines in stems count as word breaks, not unknown characters. */
function wrap(s: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = s.split(/\s+/).filter(Boolean).map((w) => safe(w));
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildReceipt(c: CandidateRow): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Cognitive Aptitude Assessment — Submission Receipt');
  pdf.setAuthor('Cognitive Aptitude Assessment');
  pdf.setSubject('Submission receipt and performance review');
  pdf.setProducer('Cognitive Aptitude Assessment');

  let regular: PDFFont;
  let bold: PDFFont;
  try {
    pdf.registerFontkit(fontkit);
    const dir = join(process.cwd(), 'src', 'assets', 'fonts');
    regular = await pdf.embedFont(readFileSync(join(dir, 'PlusJakartaSans-Regular.ttf')), { subset: true });
    bold = await pdf.embedFont(readFileSync(join(dir, 'PlusJakartaSans-Bold.ttf')), { subset: true });
  } catch (err) {
    console.error('[receipt] Brand font unavailable, falling back to Helvetica:', (err as Error)?.message);
    regular = await pdf.embedFont(StandardFonts.Helvetica);
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  }

  let page = pdf.addPage(A4);
  const { width, height } = page.getSize();
  const right = width - MARGIN;
  let y = height - MARGIN;

  const newPage = () => {
    page = pdf.addPage(A4);
    y = height - MARGIN;
  };
  /** Start a new page unless `needed` points of vertical space remain. */
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 10) newPage();
  };

  const text = (
    s: string,
    opts: { size?: number; font?: PDFFont; color?: typeof INK; x?: number; align?: 'center' } = {},
  ) => {
    const size = opts.size ?? 11;
    const font = opts.font ?? regular;
    const x =
      opts.align === 'center'
        ? (width - font.widthOfTextAtSize(safe(s), size)) / 2
        : opts.x ?? MARGIN;
    page.drawText(safe(s), { x, y, size, font, color: opts.color ?? INK });
  };

  /**
   * Fully justified paragraph: wraps to the content measure, then pads the
   * word gaps of every line but the last so both edges sit flush with the
   * page margins (the PDF equivalent of text-align: justify + margin auto).
   */
  const paragraph = (
    s: string,
    opts: { size?: number; font?: PDFFont; color?: typeof INK; lineHeight?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    const font = opts.font ?? regular;
    const lineHeight = opts.lineHeight ?? 14;
    const measure = right - MARGIN;
    const lines = wrap(s, font, size, measure);
    lines.forEach((line, i) => {
      const words = line.split(' ');
      if (i === lines.length - 1 || words.length < 2) {
        text(line, { size, font, color: opts.color });
      } else {
        const wordsWidth = words.reduce((sum, w) => sum + font.widthOfTextAtSize(w, size), 0);
        const gap = (measure - wordsWidth) / (words.length - 1);
        let x = MARGIN;
        for (const w of words) {
          page.drawText(w, { x, y, size, font, color: opts.color ?? INK });
          x += font.widthOfTextAtSize(w, size) + gap;
        }
      }
      y -= lineHeight;
    });
  };

  // ---- header -------------------------------------------------------------
  text('Cognitive Aptitude Assessment', { size: 18, font: bold });
  y -= 20;
  text('Submission Receipt', { size: 12, color: MUTED });
  y -= 18;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: right, y },
    thickness: 1,
    color: LINE,
  });
  y -= 34;

  // ---- confirmation banner ------------------------------------------------
  const bannerH = 46;
  page.drawRectangle({
    x: MARGIN,
    y: y - bannerH + 16,
    width: right - MARGIN,
    height: bannerH,
    color: rgb(0.94, 0.97, 0.95),
    borderColor: rgb(0.78, 0.9, 0.83),
    borderWidth: 1,
  });
  page.drawCircle({ x: MARGIN + 24, y: y - 6, size: 9, color: GREEN });
  text('Assessment Completed and Recorded', { x: MARGIN + 42, size: 12, font: bold, color: GREEN });
  y -= 18;
  text('No further action is required from you.', { x: MARGIN + 42, size: 10, color: MUTED });
  y -= 46;

  // ---- detail table -------------------------------------------------------
  const bank = bankFor(c.level);
  const answered = Object.values(parseAnswers(c)).filter((v) => v !== null && v !== undefined).length;
  const usedSec =
    c.started_at && c.submitted_at ? Math.round((c.submitted_at - c.started_at) / 1000) : null;
  // Score, sub-domain profile and item review are disclosed; band/tier and
  // the hiring recommendation are not.
  const result = resultFor(c);

  const rows: [string, string][] = [
    ['Candidate', c.name],
    ['Position Applied For', c.position || '—'],
    ['Difficulty', bank.name],
    ['Reference', referenceCode(c)],
    ['Submitted', fmt(c.submitted_at)],
    ['Time Allowed', `${Math.round(c.duration_sec / 60)} minutes`],
    [
      'Time Used',
      usedSec === null ? '—' : `${Math.floor(usedSec / 60)} min ${usedSec % 60} s`,
    ],
    ['Questions Answered', `${answered} of ${bank.items.length}`],
    ['Correct Answers', `${result.score} of ${result.total}`],
    ['Final Score', `${result.score} / ${result.total} (${result.pct}%)`],
    [
      'Completion',
      c.submit_mode === 'timeout' ? 'Time expired — submitted automatically' : 'Submitted by candidate',
    ],
  ];

  for (const [label, value] of rows) {
    text(label, { size: 10, color: MUTED });
    text(value, { x: MARGIN + 170, size: 11, font: bold });
    y -= 8;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: right, y },
      thickness: 0.5,
      color: LINE,
    });
    y -= 20;
  }

  // ---- notice -------------------------------------------------------------
  y -= 14;
  text('About Your Result', { size: 11, font: bold, color: ACCENT });
  y -= 16;
  paragraph(
    'This receipt shows your final score, your sub-domain profile below, and a ' +
      'question-by-question review on the following pages, so you can audit your own ' +
      'performance. Your score is one input among several; the recruitment team will ' +
      'contact you about the next step.',
    { color: MUTED },
  );

  // ---- sub-domain profile -------------------------------------------------
  y -= 12;
  ensure(44 + result.domains.length * 22);
  text('Sub-Domain Profile', { size: 11, font: bold, color: ACCENT });
  y -= 14;
  paragraph('Five items per domain. Sub-scores this short are indicative, not precise measures.', {
    size: 9,
    color: MUTED,
    lineHeight: 12,
  });
  y -= 8;
  const barX = MARGIN + 230;
  const barW = right - barX;
  for (const d of result.domains) {
    text(d.label, { size: 10, color: MUTED });
    text(`${d.correct} / ${d.total}`, { x: MARGIN + 170, size: 11, font: bold });
    page.drawRectangle({ x: barX, y: y - 1, width: barW, height: 7, color: BAR_BG });
    if (d.pct > 0) {
      page.drawRectangle({
        x: barX,
        y: y - 1,
        width: Math.max(3, (barW * d.pct) / 100),
        height: 7,
        color: ACCENT,
      });
    }
    y -= 22;
  }

  // ---- item-level review --------------------------------------------------
  newPage();
  text('Item-Level Review', { size: 11, font: bold, color: ACCENT });
  y -= 14;
  paragraph(
    'Answer letters reflect the option order you saw on screen. Options are shuffled per ' +
      "sitting, so letters are not comparable with another candidate's paper.",
    { size: 9, color: MUTED, lineHeight: 12 },
  );
  y -= 10;

  const stemById = new Map(bank.items.map((i) => [i.id, i]));
  const contentW = right - MARGIN;
  result.items.forEach((it, i) => {
    const item = stemById.get(it.itemId)!;
    const stemLines = wrap(`${i + 1}. ${item.stem}`, bold, 9.5, contentW);
    const rationaleLines = wrap(item.rationale, regular, 8.5, contentW - 12);
    ensure(stemLines.length * 12 + 13 + rationaleLines.length * 11 + 16);

    for (const l of stemLines) {
      text(l, { size: 9.5, font: bold });
      y -= 12;
    }
    const status = it.correct ? 'Correct' : it.given === null ? 'Not Answered' : 'Incorrect';
    const statusColor = it.correct ? GREEN : it.given === null ? MUTED : RED;
    text(
      `${DOMAINS[it.domain]}  ·  Your Answer: ${it.givenLetter}  ·  Correct Answer: ${it.correctLetter}`,
      { size: 9, color: MUTED },
    );
    text(status, { x: right - bold.widthOfTextAtSize(status, 9), size: 9, font: bold, color: statusColor });
    y -= 13;
    for (const l of rationaleLines) {
      text(l, { x: MARGIN + 12, size: 8.5, color: MUTED });
      y -= 11;
    }
    y -= 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: 0.5, color: LINE });
    y -= 12;
  });

  // ---- footer on every page -----------------------------------------------
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      safe(`Generated ${fmt(Date.now())} · Reference ${referenceCode(c)} · Page ${i + 1} of ${pages.length}`),
      { x: MARGIN, y: MARGIN - 16, size: 8, font: regular, color: MUTED },
    );
  });

  // useObjectStreams:false costs a few hundred bytes and buys compatibility
  // with older PDF readers.
  return pdf.save({ useObjectStreams: false });
}
