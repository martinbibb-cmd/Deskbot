#!/usr/bin/env node
/**
 * Build script to copy PWA files from /web to /dist
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'web');
const destDir = path.join(__dirname, '..', 'dist');

// Remove existing dist directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
  console.log('Cleaned dist directory');
}

// Create dist directory
fs.mkdirSync(destDir, { recursive: true });
console.log('Created dist directory');

// Copy files recursively
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      copyRecursive(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${path.relative(process.cwd(), dest)}`);
  }
}

// Copy all files from web to dist
copyRecursive(sourceDir, destDir);

console.log('\n✅ Build complete! PWA files copied to dist/');
