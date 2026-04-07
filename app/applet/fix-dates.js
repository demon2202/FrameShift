const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/context/GlobalContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/new Date\(Date\.now\(\) - \d+\)\.toISOString\(\)/g, '"2026-04-03T11:00:00.000Z"');
content = content.replace(/new Date\(\)\.toISOString\(\)/g, '"2026-04-03T11:00:00.000Z"');

fs.writeFileSync(filePath, content);
console.log('Fixed dates in GlobalContext.tsx');
