const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'cesium', 'Build', 'Cesium');
const dest = path.join(__dirname, '..', 'public', 'cesium');

if (!fs.existsSync(src)) {
  console.error('[copy-cesium] Source not found:', src);
  process.exit(1);
}

if (fs.existsSync(dest)) {
  console.log('[copy-cesium] public/cesium already exists, skipping copy.');
  process.exit(0);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[copy-cesium] Copying Cesium assets to public/cesium...');
copyDir(src, dest);
console.log('[copy-cesium] Done!');
