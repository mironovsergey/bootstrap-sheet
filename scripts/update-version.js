import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packagePath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = pkg.version;

const filesToUpdate = [
  {
    path: 'README.md',
    patterns: [
      /Bootstrap Sheet v\d+\.\d+\.\d+/g,
      /badge\/version-v\d+\.\d+\.\d+/g,
      /tag\/v\d+\.\d+\.\d+/g,
    ],
    replacements: [`Bootstrap Sheet v${version}`, `badge/version-v${version}`, `tag/v${version}`],
  },
  {
    path: 'src/js/bootstrap-sheet.js',
    patterns: [/@version \d+\.\d+\.\d+/g],
    replacements: [`@version ${version}`],
  },
  {
    path: 'docs/index.html',
    patterns: [
      /<title>Bootstrap Sheet v\d+\.\d+\.\d+<\/title>/g,
      /Bootstrap Sheet v\d+\.\d+\.\d+/g,
    ],
    replacements: [`<title>Bootstrap Sheet v${version}</title>`, `Bootstrap Sheet v${version}`],
  },
];

filesToUpdate.forEach((file) => {
  const filePath = path.join(rootDir, file.path);

  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  file.patterns.forEach((pattern, index) => {
    const replacement = file.replacements[index];
    const newContent = content.replace(pattern, replacement);

    if (newContent !== content) {
      updated = true;
      content = newContent;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content);
  }
});
