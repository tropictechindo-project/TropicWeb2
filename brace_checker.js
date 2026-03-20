const fs = require('fs');

const content = fs.readFileSync('src/components/dashboard/DashboardGuide.tsx', 'utf-8');
const lines = content.split('\n');

let braceCount = 0;
let bracketCount = 0;
let parenCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bOpen = (line.match(/{/g) || []).length;
    const bClose = (line.match(/}/g) || []).length;
    const sqOpen = (line.match(/\[/g) || []).length;
    const sqClose = (line.match(/\]/g) || []).length;
    const pOpen = (line.match(/\(/g) || []).length;
    const pClose = (line.match(/\)/g) || []).length;

    braceCount += bOpen - bClose;
    bracketCount += sqOpen - sqClose;
    parenCount += pOpen - pClose;

    if (braceCount < 0) {
        console.log(`Brace Underflow at line ${i + 1}: ${line.trim()}`);
        break;
    }
    if (bracketCount < 0) {
        console.log(`Bracket Underflow at line ${i + 1}: ${line.trim()}`);
        break;
    }
}

console.log(`Final Counts - Brace: ${braceCount}, Bracket: ${bracketCount}, Paren: ${parenCount}`);
if (braceCount === 0 && bracketCount === 0 && parenCount === 0) {
    console.log("Balanced!");
} else {
    console.log("Imbalanced!");
}
