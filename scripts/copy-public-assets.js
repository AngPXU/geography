// Copy các asset cần self-host từ node_modules sang public/.
// Tránh phụ thuộc CDN bên ngoài (unpkg, cdnjs) → tránh rủi ro CDN compromise
// và đảm bảo hoạt động trong mạng nội bộ trường học (có thể chặn CDN).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function copyFile(srcRel, destRel) {
  const src = path.join(ROOT, ...srcRel);
  const dest = path.join(ROOT, ...destRel);

  if (!fs.existsSync(src)) {
    console.error(`[copy-public-assets] MISSING: ${src}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const size = (fs.statSync(dest).size / 1024).toFixed(1);
  console.log(`[copy-public-assets] ${destRel.join('/')} (${size} KB)`);
}

console.log('[copy-public-assets] Copying self-hosted assets...');

// PDF.js worker (dùng bởi react-pdf trong PdfReader / PdfViewer)
copyFile(
  ['node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'],
  ['public', 'pdf-worker', 'pdf.worker.min.mjs']
);

// Leaflet marker icons (dùng bởi InteractiveMap)
for (const f of ['marker-icon.png', 'marker-icon-2x.png', 'marker-shadow.png']) {
  copyFile(
    ['node_modules', 'leaflet', 'dist', 'images', f],
    ['public', 'leaflet', f]
  );
}

console.log('[copy-public-assets] Done!');