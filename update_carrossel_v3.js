const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = 'c:\\Users\\desig\\Desktop\\SITE-TAMP\\CARROSSEL PESSOAS';
const destRelDir = '/assets/CARROSSEL_PESSOAS';
const destAbsDir = path.join(__dirname, 'assets', 'CARROSSEL_PESSOAS');
const jsPath = path.join(__dirname, 'assets', 'index-DxwNemoW.js');

if (!fs.existsSync(destAbsDir)) {
    fs.mkdirSync(destAbsDir, { recursive: true });
}

async function run() {
    console.log("Starting conversion...");
    const files = fs.readdirSync(srcDir);
    const newArray = [];

    for (const file of files) {
        if (file.match(/\.(png|jpg|jpeg|webp)$/i)) {
            const fileNameWithoutExt = path.parse(file).name;
            const webpName = `${fileNameWithoutExt.replace(/\s+/g, '_')}.webp`;
            const fullSrcPath = path.join(srcDir, file);
            const fullDestPath = path.join(destAbsDir, webpName);

            console.log(`Converting: ${file} -> ${webpName}`);
            await sharp(fullSrcPath)
                .webp({ quality: 80 })
                .toFile(fullDestPath);
            
            newArray.push(`{src:"${destRelDir}/${webpName}",alt:"Equipe TampPlast"}`);
        }
    }

    console.log("Conversion complete. Total images: " + newArray.length);

    // Update the JS
    let content = fs.readFileSync(jsPath, 'utf8');
    
    // Find the current array.
    // Looking for [ {src:"/assets/CARROSSEL_PESSOAS/...
    const currentArrayRegex = /\[\{src:\"\/assets\/CARROSSEL_PESSOAS[^\"]*\",alt:\"Equipe TampPlast\"\}(?:,\{src:\"\/assets\/CARROSSEL_PESSOAS[^\"]*\",alt:\"Equipe TampPlast\"\})*\]/g;
    
    const replacement = `[${newArray.join(',')}]`;
    
    const match = content.match(currentArrayRegex);
    if (match) {
        content = content.replace(currentArrayRegex, replacement);
        fs.writeFileSync(jsPath, content, 'utf8');
        console.log("JS file updated successfully with the 9 images.");
    } else {
        console.log("Could not find the exact array string with the regex.");
        // Try fallback find by first image and closing bracket
        const startIndex = content.indexOf('[{src:"/assets/CARROSSEL_PESSOAS/');
        if (startIndex !== -1) {
            const endIndex = content.indexOf('}]', startIndex) + 2; 
            // This might find just one element. Let's be better.
            // Actually, we can find the start of the array and find the matching closing bracket.
            let depth = 0;
            let actualEnd = -1;
            for (let i = startIndex; i < content.length; i++) {
                if (content[i] === '[') depth++;
                else if (content[i] === ']') {
                    depth--;
                    if (depth === 0) {
                        actualEnd = i + 1;
                        break;
                    }
                }
            }
            if (actualEnd !== -1) {
                const oldText = content.substring(startIndex, actualEnd);
                content = content.replace(oldText, replacement);
                fs.writeFileSync(jsPath, content, 'utf8');
                console.log("JS file updated successfully using bracket matching.");
            }
        } else {
            console.log("Still could not find the carousel array.");
        }
    }
}

run().catch(console.error);
