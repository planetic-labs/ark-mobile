const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const pkg = require(pkgPath);

const d = new Date();
const year = d.getFullYear();
const month = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
const todayPrefix = `${year}.${month}.${day}`;

const currentVersion = pkg.version || '';

let newVersion;
if (currentVersion.startsWith(todayPrefix)) {
  // Версия уже сегодняшняя. Проверим, есть ли суффикс
  const suffix = currentVersion.slice(todayPrefix.length); // Будет пустой строкой или ".X"
  if (suffix === '') {
    newVersion = `${todayPrefix}.1`;
  } else if (suffix.startsWith('.')) {
    const num = parseInt(suffix.slice(1), 10);
    if (!isNaN(num)) {
      newVersion = `${todayPrefix}.${num + 1}`;
    } else {
      newVersion = `${todayPrefix}.1`;
    }
  } else {
    newVersion = `${todayPrefix}.1`;
  }
} else {
  // Дата изменилась или версия старая — сбрасываем на чистую сегодняшнюю дату
  newVersion = todayPrefix;
}

pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Version updated: ${currentVersion} -> ${newVersion}`);
