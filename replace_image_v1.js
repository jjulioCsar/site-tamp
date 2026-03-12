const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetFile = 'c:\\Users\\desig\\Desktop\\SITE-TAMP\\CARROSSEL PESSOAS\\Gemini_Generated_Image_r1ft1yr1ft1yr1ft.png';
const destAbsDir = path.join(__dirname, 'assets', 'CARROSSEL_PESSOAS');
const jsPath = path.join(__dirname, 'assets', 'index-DxwNemoW.js');

async function run() {
    const webpName = 'Gemini_Generated_Image_r1ft1yr1ft1yr1ft.webp';
    const fullDestPath = path.join(destAbsDir, webpName);

    console.log("Optimizing and converting NEW IMAGE...");
    await sharp(targetFile)
        .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 60 })
        .toFile(fullDestPath);
    
    console.log("New image ready: " + webpName);

    let content = fs.readFileSync(jsPath, 'utf8');
    const oldPath = "/assets/CARROSSEL_PESSOAS/_DSC0246.webp";
    const newPath = "/assets/CARROSSEL_PESSOAS/" + webpName;

    if (content.includes(oldPath)) {
        content = content.replace(oldPath, newPath);
        fs.writeFileSync(jsPath, content, 'utf8');
        console.log("JS updated: Replaced _DSC0246.webp with " + webpName);
    } else {
        console.log("OLD PATH NOT FOUND IN JS! Please check.");
    }
}

run().catch(console.error);
