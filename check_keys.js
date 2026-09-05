const fs = require('fs');
const path = require('path');

const viPath = 'frontend/src/locales/vi.json';
const viData = JSON.parse(fs.readFileSync(viPath, 'utf8')).landing;

function findKeys(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findKeys(filePath));
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const matches = [...content.matchAll(/t\([\`\']landing\.([^\`\']+?)[\`\']\)/g)];
      results = results.concat(matches.map(m => m[1]));
      
      // also handle dynamic keys like t(`landing.${item.key}`)
      // we already know what they are manually, but let's log any dynamic uses
      if (content.includes('t(`landing.${')) {
        console.log('Dynamic usage found in', filePath);
      }
    }
  }
  return results;
}

const allKeys = findKeys('frontend/src');
const uniqueKeys = [...new Set(allKeys)];

const missing = [];
for (const key of uniqueKeys) {
  if (key.includes('${')) continue; // Skip dynamic templates
  const parts = key.split('.');
  let current = viData;
  for (const p of parts) {
    if (current === undefined) break;
    current = current[p];
  }
  if (current === undefined) {
    missing.push(key);
  }
}

console.log('Missing keys:', missing);
