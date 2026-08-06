const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Kriss/.gemini/antigravity-ide/scratch/employee-management_xa/public/stat-box';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

// For 1024x1024 viewBox, the baseline of the illustrations is around Y=786.
// If we set viewBox="170 180 684 608", the bottom of the viewBox aligns right at Y=788 (the baseline line).

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace viewBox="0 0 1024 1024" with a tight viewBox ending at the baseline
  content = content.replace(/viewBox="0 0 1024 1024"/g, 'viewBox="170 180 684 608"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated viewBox for ${file}`);
});
