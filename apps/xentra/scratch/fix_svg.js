const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Kriss/.gemini/antigravity-ide/scratch/employee-management_xa/public/stat-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove the inverted full-canvas background path (starts with M 0.00 512.00 or similar full canvas box)
  content = content.replace(/<path d="M 0\.00 512\.00 L 0\.00 0\.00[\s\S]*?\/>/gi, '');
  content = content.replace(/<path d="M 0 512 L 0 0[\s\S]*?\/>/gi, '');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Cleaned ${file}`);
});
