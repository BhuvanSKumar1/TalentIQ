const { execSync } = require('child_process');
const { existsSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const root = __dirname;
const webDir = join(root, 'apps', 'web');

console.log('Root:', root);
console.log('WebDir:', webDir);
console.log('Node:', process.version);

// List what's in node_modules to debug
try {
  console.log('\n--- Root node_modules (dirs):');
  readdirSync(join(root, 'node_modules')).filter(function(e) {
    try { return statSync(join(root, 'node_modules', e)).isDirectory(); }
    catch(ex) { return false; }
  }).forEach(function(d) { console.log('  ' + d); });
} catch(e) { console.log('Cannot list root node_modules:', e.message); }

// Try to find vite.js
var vitePath = null;
var locations = [
  join(root, 'node_modules', 'vite', 'bin', 'vite.js'),
  join(webDir, 'node_modules', 'vite', 'bin', 'vite.js'),
  join(root, 'node_modules', '.pnpm', 'vite@5.4.21', 'node_modules', 'vite', 'bin', 'vite.js'),
];

console.log('\nSearching for vite.js:');
for (var i = 0; i < locations.length; i++) {
  var found = existsSync(locations[i]);
  console.log('  ' + locations[i] + ' -> ' + (found ? 'EXISTS' : 'NOT FOUND'));
  if (found && !vitePath) vitePath = locations[i];
}

// Glob search in .pnpm if not found
if (!vitePath) {
  console.log('\nSearching .pnpm for vite:');
  try {
    var pnpmDir = join(root, 'node_modules', '.pnpm');
    var entries = readdirSync(pnpmDir).filter(function(e) { return e.startsWith('vite@'); });
    console.log('  Found entries:', entries);
    if (entries.length > 0) {
      var candidate = join(pnpmDir, entries[0], 'node_modules', 'vite', 'bin', 'vite.js');
      if (existsSync(candidate)) {
        vitePath = candidate;
        console.log('  Using:', candidate);
      }
    }
  } catch(e) { console.log('  Error:', e.message); }
}

// Last resort: find command
if (!vitePath) {
  console.log('\nUsing find command as last resort:');
  try {
    var result = execSync('find ../../node_modules -name vite.js -path "*/vite/bin/*" 2>/dev/null | head -1', { encoding: 'utf8', cwd: webDir }).trim();
    if (result && existsSync(result)) {
      vitePath = result;
      console.log('  Found:', result);
    }
  } catch(e) { console.log('  find failed:', e.message); }
}

if (!vitePath) {
  console.error('\nFATAL: Could not find vite.js anywhere');
  process.exit(1);
}

console.log('\nUsing vite:', vitePath);
console.log('Building...');

try {
  execSync('node "' + vitePath + '" build', { stdio: 'inherit', cwd: webDir });
  console.log('\nBuild complete!');
} catch(e) {
  console.error('\nBuild failed:', e.message);
  process.exit(1);
}
