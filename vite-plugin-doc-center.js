import { readdirSync, copyFileSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { resolve, join, basename, extname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Vite plugin: scan 需求文档/, 流程图/, 测试用例/ folders, copy files to public/,
 * and generate public/doc-manifest.json automatically.
 *
 * File naming convention: filename contains "V{version}" e.g. 需求文档-V2.5-xxx.md
 * Files without a version tag are grouped under "未分类".
 */
export default function docCenterPlugin() {
  const projectRoot = __dirname;
  const docsDir = join(projectRoot, '需求文档');
  const flowsDir = join(projectRoot, '流程图');
  const casesDir = join(projectRoot, '测试用例');
  const publicDir = join(__dirname, 'public');
  const publicDocs = join(publicDir, 'docs');
  const publicFlows = join(publicDir, 'flows');
  const publicCases = join(publicDir, 'cases');

  const VERSION_RE = /[Vv](\d+(?:\.\d+)?)/;

  function ensureDir(dir) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  function extractXmindThumbnail(xmindPath, destPath) {
    // Use adm-zip via dynamic require in CJS wrapper
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(xmindPath);
    const entry = zip.getEntry('Thumbnails/thumbnail.png');
    if (entry) {
      writeFileSync(destPath, entry.getData());
    } else {
      throw new Error('No thumbnail found in xmind');
    }
  }

  function scan() {
    ensureDir(publicDocs);
    ensureDir(publicFlows);
    ensureDir(publicCases);

    const versions = {};

    function addVersion(key) {
      if (!versions[key]) {
        versions[key] = { key, docs: [], flows: [], cases: [] };
      }
      return versions[key];
    }

    // Scan 需求文档
    if (existsSync(docsDir)) {
      for (const file of readdirSync(docsDir)) {
        const ext = extname(file).toLowerCase();
        if (ext !== '.md') continue; // only process markdown files
        const match = file.match(VERSION_RE);
        const verKey = match ? match[1] : 'uncategorized';
        const entry = addVersion(verKey);

        const destName = file;
        copyFileSync(join(docsDir, file), join(publicDocs, destName));

        const title = basename(file, ext).replace(/[-_]/g, ' ').replace(new RegExp(`[Vv]${verKey.replace('.', '\\.')}`, 'i'), '').trim() || basename(file, ext);
        entry.docs.push({ title, file: `docs/${destName}` });
      }
    }

    // Scan 流程图
    if (existsSync(flowsDir)) {
      for (const file of readdirSync(flowsDir)) {
        const ext = extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(ext)) continue;
        const match = file.match(VERSION_RE);
        const verKey = match ? match[1] : 'uncategorized';
        const entry = addVersion(verKey);

        const destName = file;
        copyFileSync(join(flowsDir, file), join(publicFlows, destName));

        const title = basename(file, ext).replace(/[-_]/g, ' ').replace(new RegExp(`[Vv]${verKey.replace('.', '\\.')}`, 'i'), '').trim() || basename(file, ext);
        entry.flows.push({ title, file: `flows/${destName}` });
      }
    }

    // Scan 测试用例
    if (existsSync(casesDir)) {
      for (const file of readdirSync(casesDir)) {
        const ext = extname(file).toLowerCase();
        if (!['.xmind', '.md'].includes(ext)) continue;
        const match = file.match(VERSION_RE);
        const verKey = match ? match[1] : 'uncategorized';
        const entry = addVersion(verKey);

        const title = basename(file, ext).replace(/[-_]/g, ' ').replace(new RegExp(`[Vv]${verKey.replace('.', '\\.')}`, 'i'), '').trim() || basename(file, ext);

        if (ext === '.xmind') {
          // Extract thumbnail from xmind zip
          const thumbName = basename(file, ext) + '.png';
          const thumbDest = join(publicCases, thumbName);
          const srcPath = join(casesDir, file);
          try {
            extractXmindThumbnail(srcPath, thumbDest);
            // Also copy original xmind for download
            const xmindDest = join(publicCases, file);
            copyFileSync(srcPath, xmindDest);
            entry.cases.push({
              title,
              thumbnail: `cases/${thumbName}`,
              download: `cases/${file}`,
            });
          } catch (e) {
            console.warn(`[doc-center] Failed to extract xmind thumbnail: ${file}`, e.message);
          }
        } else {
          const destName = file;
          copyFileSync(join(casesDir, file), join(publicCases, destName));
          entry.cases.push({ title, file: `cases/${destName}` });
        }
      }
    }

    // Sort versions descending (numeric)
    const sorted = Object.values(versions).sort((a, b) => {
      const na = parseFloat(a.key) || 0;
      const nb = parseFloat(b.key) || 0;
      return nb - na;
    });

    const manifest = {
      versions: sorted.map(v => ({
        key: v.key,
        label: v.key === 'uncategorized' ? '未分类' : `V${v.key} 迭代`,
        date: '',
        docs: v.docs,
        flows: v.flows,
        cases: v.cases,
      })),
    };

    writeFileSync(join(publicDir, 'doc-manifest.json'), JSON.stringify(manifest, null, 2));

    return manifest;
  }

  return {
    name: 'doc-center-auto',
    configResolved() {
      const manifest = scan();
      console.log(`[doc-center] Scanned ${manifest.versions.length} version(s), generated manifest.`);
    },
    configureServer(server) {
      // Watch external directories (outside Vite project root)
      const dirs = [docsDir, flowsDir, casesDir].filter(existsSync);
      for (const dir of dirs) {
        server.watcher.add(dir);
      }
      const isWatched = (file) => file.startsWith(docsDir) || file.startsWith(flowsDir) || file.startsWith(casesDir);
      server.watcher.on('add', (file) => {
        if (isWatched(file)) {
          const m = scan();
          console.log(`[doc-center] File added, re-scanned → ${m.versions.length} version(s)`);
          server.ws.send({ type: 'full-reload' });
        }
      });
      server.watcher.on('change', (file) => {
        if (isWatched(file)) {
          scan();
          server.ws.send({ type: 'full-reload' });
        }
      });
      server.watcher.on('unlink', (file) => {
        if (isWatched(file)) {
          const m = scan();
          console.log(`[doc-center] File removed, re-scanned → ${m.versions.length} version(s)`);
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}
