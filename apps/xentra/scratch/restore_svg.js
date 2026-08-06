const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Kriss/.gemini/antigravity-ide/scratch/employee-management_xa/public/stat-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

// Let's ensure each SVG has <rect width="100%" height="100%" fill="white" /> or a white background circle/rect if needed
// Or let's inspect if wrapping in <g fill="#FFFFFF"> works.

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('<rect width="1024" height="1024" fill="#FFFFFF"')) {
    content = content.replace('<g>', '<g><rect width="1024" height="1024" fill="#FFFFFF" rx="60"/>');
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
console.log('Added white background rect to SVGs');
