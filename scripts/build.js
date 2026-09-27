const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
for (const file of ['index.html', 'styles.css', 'app.js', 'data.js', 'staticwebapp.config.json']) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
console.log('Built five public assets in dist/');
