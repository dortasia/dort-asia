const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Kriss/.gemini/antigravity-ide/scratch/employee-management_xa/public/stat-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the rect background we added
  content = content.replace(/<rect width="1024" height="1024" fill="#FFFFFF"[^>]*\/>/gi, '');

  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Removed square white rect from SVGs');
