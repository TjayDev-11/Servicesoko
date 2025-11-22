// scripts/convert-images.js
import { readdirSync } from 'fs';
import path from 'path';
import webpConverterPkg from 'webp-converter';

const { cwebp } = webpConverterPkg;

const imgDir = path.resolve(process.cwd(), 'public/images');

try {
  readdirSync(imgDir).forEach(file => {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      const input = path.join(imgDir, file);
      const output = input.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      cwebp(input, output, "-q 80").then(() =>
        console.log(`✅ Converted: ${file} → ${path.basename(output)}`)
      );
    }
  });
} catch (err) {
  console.error("❌ Error reading directory:", imgDir);
  console.error(err.message);
}
