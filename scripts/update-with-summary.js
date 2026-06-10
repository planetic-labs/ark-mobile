const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Загружаем переменные из .env
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    });
  }
} catch (e) {
  console.warn('Не удалось загрузить .env файл:', e.message);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Ошибка: GEMINI_API_KEY не задан в окружении или в .env файле.');
  process.exit(1);
}

// Получаем имя ветки из аргументов
const branchIndex = process.argv.indexOf('--branch');
if (branchIndex === -1 || !process.argv[branchIndex + 1]) {
  console.error('Ошибка: Укажите ветку с помощью аргумента --branch <name>');
  process.exit(1);
}
const branch = process.argv[branchIndex + 1];

// Получаем коммиты
let commits = '';
try {
  let tag = '';
  try {
    tag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch (e) {
    // Тегов нет, это нормально
  }

  if (tag) {
    commits = execSync(`git log ${tag}..HEAD --oneline`, { encoding: 'utf8' }).trim();
  } else {
    commits = execSync('git log -n 15 --oneline', { encoding: 'utf8' }).trim();
  }
} catch (e) {
  console.error('Не удалось получить лог коммитов из git:', e.message);
}

if (!commits) {
  commits = 'Нет новых изменений (коммитов).';
}

console.log('--- Список коммитов для саммари ---');
console.log(commits);
console.log('-----------------------------------');

async function generateSummary() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
  
  const prompt = `Сделай очень краткое саммари изменений (максимум 2-3 предложения на русском языке) для описания релиза мобильного приложения на основе следующих коммитов:\n\n${commits}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ошибка API Gemini: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Ответ от API Gemini не содержит текста');
    }
    return text.trim();
  } catch (e) {
    console.warn('Не удалось сгенерировать саммари через Gemini API, используем стандартное сообщение:', e.message);
    return `Update for branch ${branch}`;
  }
}

async function run() {
  let newVersion = '';
  // Обновляем версию в package.json перед сборкой
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const d = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    newVersion = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Обновлена версия в package.json: ${newVersion}`);
  } catch (e) {
    console.error('Не удалось обновить версию в package.json:', e.message);
  }

  console.log('Генерируем саммари изменений через Gemini API...');
  const summary = await generateSummary();
  console.log(`\nСгенерированное саммари: "${summary}"\n`);
  
  console.log(`Запуск eas update для ветки: ${branch}...`);
  
  const child = spawnSync('npx', ['eas-cli', 'update', '--branch', branch, '--environment', branch, '--message', summary], {
    stdio: 'inherit',
    env: process.env
  });
  
  if (child.status === 0) {
    try {
      const now = new Date();
      const pad = (num) => String(num).padStart(2, '0');
      const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
      
      const tagName = `${branch}-${newVersion || '0.0.0'}-${timeStr}`;
      
      console.log('\nДобавляем package.json в коммит...');
      execSync('git add package.json', { stdio: 'inherit' });
      
      console.log('Создаем коммит с обновлением версии...');
      execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
      
      console.log('Пушим коммит в удаленный репозиторий...');
      execSync('git push origin HEAD', { stdio: 'inherit' });
      
      console.log(`Создаем git-тег: ${tagName}...`);
      const escapedSummary = summary.replace(/"/g, '\\"');
      execSync(`git tag -a "${tagName}" -m "${escapedSummary}"`, { stdio: 'inherit' });
      
      console.log(`Отправляем тег ${tagName} в удаленный репозиторий...`);
      execSync(`git push origin "${tagName}"`, { stdio: 'inherit' });
      
      console.log(`✓ Коммит и тег успешно созданы и отправлены на GitHub.`);
    } catch (e) {
      console.error('Не удалось завершить создание коммита или git-тега:', e.message);
    }
  }
  
  process.exit(child.status);
}

run();
