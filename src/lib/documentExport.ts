/** Export only the document, never dashboard navigation or account controls. */
async function readyImages(root: HTMLElement) {
  await Promise.all(Array.from(root.querySelectorAll('img')).map(async image => {
    if (!image.complete) await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('A document image could not be loaded. Please try again.'));
    });
    if (!image.naturalWidth) throw new Error('A document image is missing. Please refresh and try again.');
  }));
}

export async function downloadDocumentPdf(source: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const clone = source.cloneNode(true) as HTMLElement;
  const stage = document.createElement('div');
  stage.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:white;pointer-events:none;';
  clone.style.cssText = 'width:794px;max-width:none;padding:16px 48px;background:white;';
  // Use the same signature columns on mobile exports and desktop exports.
  clone.querySelectorAll<HTMLElement>('section').forEach(section => {
    section.style.display = 'grid'; section.style.gridTemplateColumns = '1fr 1.2fr .7fr';
    section.style.alignItems = 'end';
  });
  clone.querySelectorAll<HTMLElement>('th, td').forEach(cell => { cell.style.padding = '6px 5px'; });
  stage.append(clone); document.body.append(stage);
  try {
    await document.fonts.ready;
    await readyImages(clone);
    const top = clone.getBoundingClientRect().top;
    const blocks = Array.from(clone.querySelectorAll('p, tr, h2, section, img, footer')).map(el => {
      const r = el.getBoundingClientRect(); return { top: r.top - top, bottom: r.bottom - top };
    });
    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', logging: false, windowWidth: 1024 });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const width = 190, pageHeight = 277, ratio = canvas.width / 794;
    const pagePixels = pageHeight * canvas.width / width;
    const contentHeight = Math.min(canvas.height, Math.ceil(Math.max(...blocks.map(block => block.bottom)) * ratio) + 4);
    let start = 0;
    while (start < contentHeight) {
      let end = Math.min(start + pagePixels, contentHeight);
      if (end < contentHeight) {
        // Move a paragraph, table row, or signature block to the next page intact.
        for (const block of [...blocks].sort((a, b) => a.top - b.top)) {
          const blockTop = block.top * ratio, blockBottom = block.bottom * ratio;
          if (blockTop > start + 1 && blockTop < end && blockBottom > end && blockBottom - blockTop <= pagePixels) end = blockTop;
        }
      }
      end = Math.max(start + 1, Math.floor(end));
      const slice = document.createElement('canvas');
      slice.width = canvas.width; slice.height = end - start;
      const context = slice.getContext('2d');
      if (!context) throw new Error('PDF export is unavailable in this browser. Please use Print.');
      context.drawImage(canvas, 0, start, canvas.width, slice.height, 0, 0, slice.width, slice.height);
      if (start > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 10, 10, width, slice.height * width / canvas.width);
      start = end;
    }
    pdf.save(`${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
  } finally { stage.remove(); }
}

export async function printDocument(source: HTMLElement, title: string) {
  document.getElementById('privacy-print-frame')?.remove();
  const frame = document.createElement('iframe');
  frame.id = 'privacy-print-frame'; frame.title = 'Print Privacy Authority';
  frame.style.cssText = 'position:fixed;width:794px;height:1123px;left:-10000px;top:0;border:0;';
  document.body.append(frame);
  const target = frame.contentDocument;
  if (!target || !frame.contentWindow) { frame.remove(); throw new Error('Unable to open print preview.'); }
  target.title = title;
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(node => node.cloneNode(true));
  const loaded = styles.filter(node => node instanceof HTMLLinkElement).map(node => new Promise<void>((resolve, reject) => {
    (node as HTMLLinkElement).onload = () => resolve();
    (node as HTMLLinkElement).onerror = () => reject(new Error('Unable to load print styling.'));
  }));
  styles.forEach(node => target.head.append(node));
  const css = target.createElement('style');
  css.textContent = `
    @page { size: A4; margin: 10mm; }
    html, body { margin: 0; padding: 0; background: white; }
    body { width: 190mm; }
    .privacy-authority {
      box-sizing: border-box; width: 190mm !important; max-width: none !important;
      margin: 0 auto !important; padding: 0 !important;
      font-size: 9.5pt !important; line-height: 1.4 !important;
    }
    .privacy-authority > div:first-child { width: 150px; margin-bottom: 12px; }
    .privacy-authority h2 { margin: 0 0 6px; }
    .privacy-authority table { width: 100%; margin-bottom: 12px; font-size: 8.5pt; }
    .privacy-authority th, .privacy-authority td { padding: 3px 4px; }
    .privacy-authority > .space-y-4 > p { margin-top: 8px; margin-bottom: 0; }
    .privacy-authority > .mt-8 { margin-top: 16px; }
    .privacy-authority section {
      display: grid !important; grid-template-columns: 1fr 1.2fr .7fr !important;
      align-items: end; gap: 12px; break-inside: avoid; margin-top: 12px;
    }
    .privacy-authority section img { height: 48px; }
    .privacy-authority section .min-h-10 { min-height: 24px; padding-bottom: 4px; }
    .privacy-authority section p { font-size: 8.5pt; }
    .privacy-authority footer { margin-top: 12px; padding-top: 8px; font-size: 7pt; line-height: 1.3; }
    p, tr, h2, img, footer { break-inside: avoid; }
    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  `;
  target.head.append(css); target.body.append(source.cloneNode(true));
  try {
    await Promise.all(loaded); await target.fonts.ready; await readyImages(target.body);
    const printable = target.querySelector<HTMLElement>('.privacy-authority');
    if (printable) {
      // Fit every saved signature and the footer within the A4 printable height.
      // Leave 2 mm of tolerance for browser rounding and printer pagination.
      const availableHeight = 275 * 96 / 25.4;
      const height = printable.getBoundingClientRect().height;
      if (height > availableHeight) printable.style.setProperty('zoom', String(availableHeight / height));
    }
    frame.contentWindow.focus(); frame.contentWindow.print();
  } catch (error) { frame.remove(); throw error; }
  // Keep the frame alive while the browser's print dialog is open.
}
