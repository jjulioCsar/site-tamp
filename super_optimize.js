const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDir = path.join(__dirname, 'assets');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.match(/\.(jpg|jpeg|png)$/i)) {
      const ext = path.extname(entry.name);
      const nameWithoutExt = path.basename(entry.name, ext);
      const webpPath = path.join(dir, `${nameWithoutExt}.webp`);

      console.log(`Processing & Converting: ${fullPath}`);
      try {
        await sharp(fullPath)
          .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 60, effort: 6 }) // Aggressive quality reduction
          .toFile(webpPath);
        
        fs.unlinkSync(fullPath); // Cleanup original
      } catch (err) {
        console.error(`  Error processing ${fullPath}: ${err.message}`);
      }
    } else if (entry.name.match(/\.webp$/i)) {
      // Re-optimize existing webp to be even smaller
      const stats = fs.statSync(fullPath);
      if (stats.size > 80 * 1024) { // Target < 80KB for most images
        console.log(`Aggressively re-optimizing webp: ${fullPath} (${(stats.size/1024).toFixed(2)} KB)`);
        const buffer = fs.readFileSync(fullPath);
        try {
          await sharp(buffer)
            .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true }) // Smaller dimensions
            .webp({ quality: 50, effort: 6 })
            .toFile(fullPath + '.tmp');
          
          fs.renameSync(fullPath + '.tmp', fullPath);
          const newStats = fs.statSync(fullPath);
          console.log(`  -> Downsized to ${(newStats.size/1024).toFixed(2)} KB`);
        } catch (err) {
          console.error(`  Error re-optimizing ${fullPath}: ${err.message}`);
        }
      }
    }
  }
}

async function updateJS() {
  const jsDir = path.join(__dirname, 'assets');
  const files = fs.readdirSync(jsDir);
  const jsFiles = files.filter(f => f.endsWith('.js'));

  for (const jsFile of jsFiles) {
    const fullPath = path.join(jsDir, jsFile);
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    // Ensure all references are .webp
    content = content.replace(/\.(jpg|jpeg|png)(["'])/gi, '.webp$2');
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Fixed JS references in ${jsFile}`);
    }
  }
}

async function run() {
  console.log('--- STARTING SUPER AGGRESSIVE OPTIMIZATION ---');
  await processDirectory(targetDir);
  await updateJS();
  console.log('--- OPTIMIZATION COMPLETE ---');
}

run().catch(console.error);
