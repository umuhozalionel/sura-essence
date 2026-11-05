/**
 * The itinerary a customer downloads once they've made their choices: the SURA
 * logo on top, then the details, the day plan and the price. Built in the
 * browser; pdf-lib loads only when it's asked for. Browser only.
 */
export type TripPdfData = {
  title: string;
  labels: Record<"heading" | "reference" | "details" | "name" | "phone" | "date" | "pickup" | "package" | "vehicle" | "guests" | "plan" | "arranged" | "included" | "toQuote" | "price" | "perGuest" | "note", string>;
  reference: string | null;
  details: { name: string; phone: string; date: string; pickup: string; package: string; vehicle: string; guests: string[] };
  plan: { time: string; label: string }[];
  included: string[];
  toQuote: string[];
  total: string;
  perGuest: string;
  usd: string;
  /** Bold the dollar and euro line, for guests paying from abroad. */
  usdStrong: boolean;
  contact: string;
  fileName: string;
};

const PAGE = { width: 595, height: 842, margin: 48 };

/** The built-in PDF fonts only have Western letters: anything else becomes "?" rather than failing. */
const printable = (s: string) => s.replace(/[  ]/g, " ").replace(/[≈]/g, "about ").replace(/[^\x20-\x7e¡-ÿ’‘“”–—…œŒ€•]/g, "?");

export async function downloadTripPdf(data: TripPdfData): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(printable(`${data.title} - ${data.labels.heading}`));
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.09, 0.11, 0.16);
  const quiet = rgb(0.4, 0.42, 0.47);
  const line = rgb(0.85, 0.85, 0.83);
  const width = PAGE.width - PAGE.margin * 2;

  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - PAGE.margin;
  const room = (needed: number) => {
    if (y - needed < PAGE.margin) {
      page = doc.addPage([PAGE.width, PAGE.height]);
      y = PAGE.height - PAGE.margin;
    }
  };

  const wrap = (text: string, size: number, font: typeof regular, max: number) => {
    const out: string[] = [];
    let current = "";
    for (const word of printable(text).split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > max && current) {
        out.push(current);
        current = word;
      } else current = next;
    }
    if (current) out.push(current);
    return out;
  };
  const write = (text: string, { size = 10, font = regular, color = ink, x = PAGE.margin, max = width, gap = 4 } = {}) => {
    for (const l of wrap(text, size, font, max)) {
      room(size + gap);
      y -= size;
      page.drawText(l, { x, y, size, font, color });
      y -= gap;
    }
  };
  const heading = (text: string) => {
    y -= 14;
    room(40);
    write(text.toUpperCase(), { size: 9, font: bold, color: quiet, gap: 4 });
    page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.margin + width, y }, thickness: 0.75, color: line });
    y -= 10;
  };
  const row = (label: string, value: string) => {
    room(16);
    page.drawText(printable(label), { x: PAGE.margin, y: y - 10, size: 10, font: bold, color: ink });
    write(value, { x: PAGE.margin + 130, max: width - 130, gap: 6 });
  };

  // The logo, on top.
  try {
    const bytes = await (await fetch("/brand/sura-logo.png")).arrayBuffer();
    const logo = await doc.embedPng(bytes);
    const h = 46;
    const w = (logo.width / logo.height) * h;
    y -= h;
    page.drawImage(logo, { x: PAGE.margin, y, width: w, height: h });
    y -= 22;
  } catch (err) {
    console.warn("[trip pdf] logo not added:", err);
  }

  write(data.title, { size: 20, font: bold, gap: 4 });
  write(data.labels.heading, { size: 11, color: quiet, gap: 4 });
  if (data.reference) write(`${data.labels.reference}: ${data.reference}`, { size: 11, font: bold, gap: 2 });

  heading(data.labels.details);
  row(data.labels.name, data.details.name);
  row(data.labels.phone, data.details.phone);
  row(data.labels.date, data.details.date);
  row(data.labels.pickup, data.details.pickup);
  row(data.labels.package, data.details.package);
  row(data.labels.vehicle, data.details.vehicle);
  row(data.labels.guests, data.details.guests.join("; "));

  heading(data.labels.plan);
  for (const stop of data.plan.filter((s) => s.time)) {
    room(16);
    page.drawText(stop.time, { x: PAGE.margin, y: y - 10, size: 10, font: bold, color: ink });
    write(stop.label, { x: PAGE.margin + 60, max: width - 60, gap: 6 });
  }

  const arranged = data.plan.filter((s) => !s.time);
  if (arranged.length) {
    y -= 4;
    write(data.labels.arranged, { size: 10, font: bold, gap: 5 });
    for (const stop of arranged) write(`-  ${stop.label}`, { gap: 5 });
  }

  heading(data.labels.included);
  for (const item of data.included) write(`-  ${item}`, { gap: 5 });

  if (data.toQuote.length) {
    heading(data.labels.toQuote);
    for (const item of data.toQuote) write(`-  ${item}`, { gap: 5 });
  }

  heading(data.labels.price);
  row(data.labels.price, data.total);
  row(data.labels.perGuest, data.perGuest);
  write(data.usd, data.usdStrong ? { size: 9, font: bold } : { size: 9, color: quiet });
  y -= 10;
  write(data.labels.note, { size: 9, color: quiet });
  y -= 6;
  write(data.contact, { size: 9, font: bold });

  const blob = new Blob([new Uint8Array(await doc.save())], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = data.fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
