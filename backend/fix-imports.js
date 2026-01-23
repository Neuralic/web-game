import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find all TypeScript files
const files = glob.sync('src/**/*.ts', { cwd: __dirname });

console.log(`Found ${files.length} TypeScript files`);

files.forEach(file => {
  const filePath = join(__dirname, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Replace relative imports without .js extension
  const newContent = content.replace(
    /from\s+['"](\.\.[\/\\].*?|\.\/.*?)(?<!\.js)['"]/g,
    (match, importPath) => {
      modified = true;
      return `from '${importPath}.js'`;
    }
  );

  if (modified) {
    writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');
