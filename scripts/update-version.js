const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const pkg = require(pkgPath);

const currentVersion = pkg.version || '0.0.1';
const parts = currentVersion.split('.');

let newVersion = '0.0.1';
if (parts.length === 3) {
  const major = parseInt(parts[0], 10);
  const minor = parseInt(parts[1], 10);
  const patch = parseInt(parts[2], 10);
  if (!isNaN(major) && !isNaN(minor) && !isNaN(patch)) {
    newVersion = `${major}.${minor}.${patch + 1}`;
  }
} else {
  newVersion = '0.0.1';
}

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Native build version updated: ${currentVersion} -> ${newVersion}`);
