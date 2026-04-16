const fs = require('fs');
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

async function checkText() {
  const data = new Uint8Array(fs.readFileSync('public/books/grade-6.pdf'));
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  let hasText = false;
  for (let i = 1; i <= Math.min(10, pdf.numPages); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map(it => it.str).join('');
    if (str.trim().length > 0) {
      console.log(`Page ${i} has text:`, str.slice(0, 100));
      hasText = true;
    }
  }
  
  if (!hasText) {
    console.log("NO TEXT EXTRACTED! It is likely a scanned PDF.");
  }
}
checkText().catch(console.error);
