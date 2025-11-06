import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const INPUT_DIR = './src/assets/images';
const OUTPUT_DIR = './public/images';

async function isDirectory(path) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 }) // Adjust quality as needed (0-100)
      .toFile(outputPath);
    console.log(`✅ Converted: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error);
  }
}

async function processDirectory(dir) {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const inputPath = join(dir, file);
      const isDir = await isDirectory(inputPath);
      
      if (isDir) {
        await processDirectory(inputPath);
        continue;
      }
      
      const ext = extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const outputPath = join(OUTPUT_DIR, `${file.slice(0, -ext.length)}.webp`);
        await convertToWebP(inputPath, outputPath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
  }
}

// Create directories if they don't exist
await mkdir(OUTPUT_DIR, { recursive: true }).catch(() => {});

console.log('🔄 Converting images to WebP format...');
await processDirectory(INPUT_DIR);
console.log('✨ Conversion complete!');