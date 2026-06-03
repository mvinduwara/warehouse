import PDFDocument from "pdfkit";
import { Writable, PassThrough } from "stream";

export interface PdfTable {
  headers: string[];
  rows: string[][];
  colWidths?: number[];
}

export interface PdfSection {
  title?: string;
  body?: string;
  table?: PdfTable;
  spacer?: number;
}

export interface PdfDocumentOptions {
  title: string;
  subtitle?: string;
  watermark?: string;
  sections: PdfSection[];
}

const BRAND_GREEN = "#4ade80";
const DARK_BG = "#0d0f14";
const DARK2 = "#13161e";
const LIGHT_TEXT = "#e8eaf0";
const MUTED = "#8b92a8";
const BORDER = "#2a2f42";

export function generatePdf(opts: PdfDocumentOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: { Title: opts.title, Author: "WarehouseOS" },
    });

    const chunks: Buffer[] = [];
    const stream = new PassThrough();

    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);

    doc.pipe(stream);

    // ── Header ──────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK_BG);
    doc.rect(0, 0, 6, 80).fill(BRAND_GREEN);

    doc.fillColor(BRAND_GREEN)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("W", 22, 22, { lineBreak: false });

    doc.fillColor(LIGHT_TEXT)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("WarehouseOS", 40, 24, { lineBreak: false });

    doc.fillColor(LIGHT_TEXT)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(opts.title, 50, 52);

    if (opts.subtitle) {
      doc.fillColor(MUTED)
        .fontSize(10)
        .font("Helvetica")
        .text(opts.subtitle, 50, 68);
    }

    // ── Generated timestamp ─────────────────────────────────────────────
    doc.fillColor(MUTED)
      .fontSize(9)
      .text(
        `Generated: ${new Date().toLocaleString()}`,
        doc.page.width - 200,
        65,
        { width: 150, align: "right" }
      );

    doc.moveDown(4);

    // ── Sections ────────────────────────────────────────────────────────
    for (const section of opts.sections) {
      if (section.spacer) {
        doc.moveDown(section.spacer);
        continue;
      }

      if (section.title) {
        doc.fillColor(DARK_BG)
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(section.title.toUpperCase(), { characterSpacing: 0.5 });

        doc.rect(50, doc.y + 2, doc.page.width - 100, 1).fill(BORDER);
        doc.moveDown(0.8);
      }

      if (section.body) {
        doc.fillColor("#333333")
          .fontSize(10)
          .font("Helvetica")
          .text(section.body, { lineGap: 4 });
        doc.moveDown(0.5);
      }

      if (section.table) {
        renderTable(doc, section.table);
        doc.moveDown(1);
      }
    }

    // ── Footer ──────────────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill("#f5f5f5");
      doc.fillColor(MUTED)
        .fontSize(9)
        .text(
          `Page ${i + 1} of ${range.count}  ·  WarehouseOS  ·  Confidential`,
          50,
          doc.page.height - 24,
          { align: "center", width: doc.page.width - 100 }
        );
    }

    doc.end();
  });
}

function renderTable(doc: typeof PDFDocument.prototype, table: PdfTable): void {
  const pageWidth = doc.page.width - 100;
  const defaultColWidth = pageWidth / table.headers.length;
  const colWidths = table.colWidths ?? table.headers.map(() => defaultColWidth);
  const rowHeight = 24;
  const x = 50;

  // Header row
  doc.rect(x, doc.y, pageWidth, rowHeight).fill(DARK_BG);
  let cx = x;
  for (let i = 0; i < table.headers.length; i++) {
    doc.fillColor(LIGHT_TEXT)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(table.headers[i]!.toUpperCase(), cx + 6, doc.y - rowHeight + 8, {
        width: colWidths[i]! - 12,
        lineBreak: false,
      });
    cx += colWidths[i]!;
  }
  doc.moveDown(0);

  // Data rows
  for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows[r]!;
    const rowY = doc.y;
    const fillColor = r % 2 === 0 ? "#ffffff" : "#f9f9f9";

    doc.rect(x, rowY, pageWidth, rowHeight).fill(fillColor);
    doc.rect(x, rowY, pageWidth, rowHeight).stroke("#e5e5e5");

    cx = x;
    for (let c = 0; c < row.length; c++) {
      doc.fillColor("#1a1a1a")
        .fontSize(9)
        .font("Helvetica")
        .text(row[c] ?? "", cx + 6, rowY + 8, {
          width: colWidths[c]! - 12,
          lineBreak: false,
        });
      cx += colWidths[c]!;
    }

    doc.y = rowY + rowHeight;

    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    }
  }
}