const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Kriss/.gemini/antigravity-ide/scratch/employee-management_xa/public/stat-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find all Y coordinates in the path d attributes
  const matches = content.match(/([0-9]+\.[0-9]+)/g) || [];
  if (matches.length > 0) {
    console.log(`${file}: total numbers ${matches.length}`);
  }
});
