import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = 'C:/Users/apste/Desktop/SM/F-U';
const stagingDir = path.join(projectRoot, '_temp_zip_staging');
const outputZip = path.join(projectRoot, 'InsureFlow_Diagram_Source.zip');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

function copyFile(relPath) {
  const src = path.join(projectRoot, relPath);
  const dest = path.join(stagingDir, relPath);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

function copyDir(relDir, excludeExts = [], excludeNames = []) {
  const srcDir = path.join(projectRoot, relDir);
  if (!fs.existsSync(srcDir)) return 0;
  let count = 0;

  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullSrc = path.join(currentDir, entry.name);
      const relPath = path.relative(projectRoot, fullSrc);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'uploads' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }
        traverse(fullSrc);
      } else if (entry.isFile()) {
        if (entry.name.startsWith('.env') || entry.name.endsWith('.traineddata') || entry.name.endsWith('.log')) {
          continue;
        }
        if (excludeNames.includes(entry.name)) continue;
        const ext = path.extname(entry.name).toLowerCase();
        if (excludeExts.includes(ext)) continue;

        const dest = path.join(stagingDir, relPath);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(fullSrc, dest);
        count++;
      }
    }
  }

  traverse(srcDir);
  return count;
}

console.log('[Packaging] Staging selected source files...');

// 1. Root files
copyFile('package.json');
copyFile('.gitignore');

// 2. Server files
copyFile('server/package.json');
const serverSrcCount = copyDir('server/src');
const serverTestCount = copyDir('server/tests');
console.log(`[Server] Copied ${serverSrcCount} files from server/src and ${serverTestCount} files from server/tests`);

// 3. Client files
copyFile('client/package.json');
copyFile('client/index.html');
copyFile('client/vite.config.js');
copyFile('client/tailwind.config.js');
copyFile('client/postcss.config.js');
const clientSrcCount = copyDir('client/src');
console.log(`[Client] Copied ${clientSrcCount} files from client/src`);

// 4. Safety scan on staged files
console.log('[Safety] Scanning staged files for secrets and forbidden patterns...');
let violations = [];
let totalFiles = 0;

function scanStaged(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(stagingDir, fullPath);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'uploads') {
        violations.push(`Forbidden directory staged: ${relPath}`);
      }
      scanStaged(fullPath);
    } else if (entry.isFile()) {
      totalFiles++;
      if (entry.name.startsWith('.env')) {
        violations.push(`Forbidden .env file staged: ${relPath}`);
      }
      if (entry.name.endsWith('.traineddata')) {
        violations.push(`Forbidden binary staged: ${relPath}`);
      }
      // Content check for raw connection string with passwords
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('RwEGy17ok11dGf8X')) {
        violations.push(`Atlas credential found in ${relPath}`);
      }
    }
  }
}

scanStaged(stagingDir);

if (violations.length > 0) {
  console.error('[Error] Security violations detected in staging:');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`[Safety] All ${totalFiles} staged files passed security and secrets validation.`);

// 5. Compress using PowerShell Compress-Archive
console.log('[Packaging] Compressing staged files into InsureFlow_Diagram_Source.zip...');
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

// In PowerShell, we compress contents of stagingDir
const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${outputZip}' -Force"`;
execSync(psCmd, { stdio: 'inherit' });

// 6. Clean up staging folder
fs.rmSync(stagingDir, { recursive: true, force: true });

const stat = fs.statSync(outputZip);
console.log(`[Success] Archive created successfully at: ${outputZip}`);
console.log(`Archive size: ${(stat.size / 1024).toFixed(2)} KB (${stat.size} bytes)`);
