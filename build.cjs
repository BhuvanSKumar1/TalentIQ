const { execSync } = require('child_process');
const { existsSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const webDir = join(__dirname, 'apps', 'web');

// Find vite.js by searching node_modules
function findVite(dir, maxDepth, depth) {
  depth = depth || 0;
  maxDepth = maxDepth || 6;
  if (depth > maxDepth) return null;
  try {
    var entries = readdirSync(dir);
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var fullPath = join(dir, entry);
      try {
        if (statSync(fullPath).isDirectory()) {
          if (entry === 'vite' && existsSync(join(fullPath, 'bin', 'vite.js'))) {
            return join(fullPath, 'bin', 'vite.js');
          }
          var found = findVite(fullPath, maxDepth, depth + 1);
          if (found) return found;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
}

// Search multiple known locations first (fast)
var candidates = [
  join(webDir, 'node_modules', 'vite', 'bin', 'vite.js'),
  join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js'),
];

var vitePath = null;
for (var i = 0; i < candidates.length; i++) {
  if (existsSync(candidates[i])) {
    vitePath = candidates[i];
    break;
  }
}

// Deep search fallback
if (!vitePath) {
  vitePath = findVite(join(__dirname, 'node_modules'), 8);
}

if (!vitePath) {
  console.error('ERROR: Could not find vite.js');
  process.exit(1);
}

console.log('Using vite: ' + vitePath);
console.log('Building from: ' + webDir);

try {
  execSync('node "' + vitePath + '" build', { stdio: 'inherit', cwd: webDir });
  console.log('Build complete!');
} catch (e) {
  console.error('Build failed');
  process.exit(1);
}
