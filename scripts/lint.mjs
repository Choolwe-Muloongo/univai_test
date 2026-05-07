import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const forbiddenImportGuard = /try\s*{[\s\S]{0,300}(?:import\s*\(|require\s*\()/m;
const roots = ['src'];
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', 'vendor'].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if ([...extensions].some((ext) => full.endsWith(ext))) files.push(full);
  }
  return files;
}

const violations = [];
for (const root of roots) {
  for (const file of walk(root)) {
    const source = readFileSync(file, 'utf8');
    if (forbiddenImportGuard.test(source)) {
      violations.push(file);
    }
  }
}

if (violations.length) {
  console.error('Forbidden try/catch around imports found in:');
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

const tsc = spawnSync('npx', ['tsc', '--noEmit'], { stdio: 'inherit', shell: true });
process.exit(tsc.status ?? 1);
