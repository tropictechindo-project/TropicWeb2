const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/DashboardGuide.tsx', 'utf-8');
const lines = content.split('\n');

let depth = 0;
let keys = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('ADMIN:')) console.log(`ADMIN found at line ${i + 1}, Depth: ${depth}`);
    if (line.includes('OPERATOR:')) console.log(`OPERATOR found at line ${i + 1}, Depth: ${depth}`);
    if (line.includes('WORKER:')) console.log(`WORKER found at line ${i + 1}, Depth: ${depth}`);
    if (line.includes('USER:')) console.log(`USER found at line ${i + 1}, Depth: ${depth}`);

    const bOpen = (line.match(/{/g) || []).length;
    const bClose = (line.match(/}/g) || []).length;
    depth += bOpen - bClose;
}
console.log(`Finished. Final depth: ${depth}`);
