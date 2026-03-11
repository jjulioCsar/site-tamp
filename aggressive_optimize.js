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

      console.log(`Processing: ${fullPath}`);
      try {
        await sharp(fullPath)
          .resize({ width: 1000, withoutEnlargement: true })
          .webp({ quality: 75 })
          .toFile(webpPath);
        
        // Remove original large file to save space and avoid confusion
        fs.unlinkSync(fullPath);
        console.log(`  -> Created ${webpPath} and removed original.`);
      } catch (err) {
        console.error(`  Error processing ${fullPath}: ${err.message}`);
      }
    } else if (entry.name.match(/\.webp$/i)) {
      // Re-optimize existing webp if they are too large
      const stats = fs.statSync(fullPath);
      if (stats.size > 200 * 1024) { // > 200KB is usually a sign of unoptimized webp or very high res
        console.log(`Re-optimizing large webp: ${fullPath} (${(stats.size/1024).toFixed(2)} KB)`);
        const buffer = fs.readFileSync(fullPath);
        try {
          await sharp(buffer)
            .resize({ width: 1000, withoutEnlargement: true })
            .webp({ quality: 70 })
            .toFile(fullPath + '.tmp');
          
          fs.renameSync(fullPath + '.tmp', fullPath);
          const newStats = fs.statSync(fullPath);
          console.log(`  -> Optimized to ${(newStats.size/1024).toFixed(2)} KB`);
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
    // Replace .jpg, .jpeg, .png with .webp in paths
    content = content.replace(/\.(jpg|jpeg|png)(["'])/gi, '.webp$2');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated image references in ${jsFile}`);
    }
  }
}

async function run() {
  console.log('Starting massive image optimization...');
  await processDirectory(targetDir);
  console.log('Updating JS references...');
  await updateJS();
  console.log('Optimization complete!');
}

run().catch(console.error);
