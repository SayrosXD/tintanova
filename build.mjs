import { cpSync, existsSync, lstatSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('./', import.meta.url)));
const output = join(root, 'dist');
const publicFiles = [
  'index.html', 'proyecto.html',
  'styles.css', 'process.css', 'compare.css',
  'lab.js', 'process.js', 'compare.js', 'balance.js',
  'assets'
];

if (existsSync(output)) {
  if (!lstatSync(output).isDirectory() || realpathSync(output) !== output) {
    throw new Error('dist debe ser un directorio dentro del repositorio.');
  }
  rmSync(output, { recursive: true });
}

mkdirSync(output);
for (const file of publicFiles) {
  cpSync(join(root, file), join(output, file), { recursive: true });
}
