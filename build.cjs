const { execSync } = require('child_process');
const { existsSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const root = __dirname;
const webDir = join(root, 'apps', 'web');
const apiDir = join(root, 'apps', 'api');
const pnpmStore = join(root, 'node_modules', '.pnpm');

console.log('Root:', root);
console.log('Node:', process.version);

// ------------------------------------------------------------
// Helpers to locate runnable JS entry points. pnpm workspaces do
// not put binaries where `npx` expects them, so we resolve the
// actual JavaScript file and run it with `node` — deterministic
// on Vercel and locally.
// ------------------------------------------------------------
function findFirst(base, candidates) {
  for (const rel of candidates) {
    const p = join(base, rel);
    if (existsSync(p)) return p;
  }
  return null;
}

function findInPnpmStore(packagePrefix, relEntry) {
  try {
    const entries = readdirSync(pnpmStore).filter((e) => e.startsWith(packagePrefix));
    if (entries.length > 0) {
      const p = join(pnpmStore, entries[0], 'node_modules', relEntry);
      if (existsSync(p)) return p;
    }
  } catch (e) {
    /* store missing — fall through */
  }
  return null;
}

function findPrisma() {
  return (
    findFirst(apiDir, [join('node_modules', 'prisma', 'build', 'index.js')]) ||
    findFirst(root, [join('node_modules', 'prisma', 'build', 'index.js')]) ||
    findInPnpmStore('prisma@', join('prisma', 'build', 'index.js'))
  );
}

function findTsc() {
  return (
    findFirst(root, [join('node_modules', 'typescript', 'bin', 'tsc')]) ||
    findFirst(apiDir, [join('node_modules', 'typescript', 'bin', 'tsc')]) ||
    findInPnpmStore('typescript@', join('typescript', 'bin', 'tsc'))
  );
}

function findVite() {
  let vite = findFirst(root, [join('node_modules', 'vite', 'bin', 'vite.js')]);
  if (!vite) vite = findFirst(webDir, [join('node_modules', 'vite', 'bin', 'vite.js')]);
  if (!vite) vite = findInPnpmStore('vite@', join('vite', 'bin', 'vite.js'));
  return vite;
}

// ------------------------------------------------------------
// Step 1 — Generate the Prisma client.
// The @prisma/client postinstall cannot find the schema (it lives
// at apps/api/prisma), so it must be generated explicitly before
// the API is bundled into the serverless function.
// ------------------------------------------------------------
const prismaJs = findPrisma();
if (!prismaJs) {
  console.error('\nFATAL: Could not find the prisma CLI anywhere');
  process.exit(1);
}
console.log('\n[1/3] Generating Prisma client:', prismaJs);
execSync(`node "${prismaJs}" generate --schema "${join(apiDir, 'prisma', 'schema.prisma')}"`, {
  stdio: 'inherit',
  cwd: root,
});

// ------------------------------------------------------------
// Step 2 — Compile the Express API (apps/api/src -> dist) so the
// Vercel function at api/[...path].js can import the plain JS app.
// ------------------------------------------------------------
const tscJs = findTsc();
if (!tscJs) {
  console.error('\nFATAL: Could not find the TypeScript compiler anywhere');
  process.exit(1);
}
console.log('\n[2/3] Compiling API:', tscJs);
execSync(`node "${tscJs}" -p "${join(apiDir, 'tsconfig.json')}"`, { stdio: 'inherit', cwd: root });

// ------------------------------------------------------------
// Step 3 — Build the web frontend (same as before).
// ------------------------------------------------------------
const viteJs = findVite();
if (!viteJs) {
  console.error('\nFATAL: Could not find vite anywhere');
  process.exit(1);
}
console.log('\n[3/3] Building web with vite:', viteJs);
execSync(`node "${viteJs}" build`, { stdio: 'inherit', cwd: webDir });
console.log('\nBuild complete!');
