const fs = require('fs');
const path = require('path');

console.log('=== DIAGNOSTIC: Checking Tiptap dependencies ===\n');

// Проверяем package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('1. Dependencies in package.json:');
const tiptapDeps = Object.keys(packageJson.dependencies).filter(dep => dep.includes('tiptap'));
tiptapDeps.forEach(dep => {
  console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
});

console.log('\n2. Checking node_modules:');
const nodeModulesPath = path.join(__dirname, 'node_modules');

function checkTiptapModules(dir) {
  try {
    const items = fs.readdirSync(dir);
    const tiptapItems = items.filter(item => item.includes('tiptap'));
    tiptapItems.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      console.log(`   📁 ${item} (${stats.isDirectory() ? 'directory' : 'file'})`);
    });
    return tiptapItems.length > 0;
  } catch (error) {
    console.log(`   ❌ Cannot read node_modules: ${error.message}`);
    return false;
  }
}

const hasTiptapModules = checkTiptapModules(nodeModulesPath);

console.log('\n3. Checking specific table extensions:');
const tableExtensions = [
  '@tiptap/extension-table',
  '@tiptap/extension-table-row', 
  '@tiptap/extension-table-header',
  '@tiptap/extension-table-cell'
];

tableExtensions.forEach(ext => {
  const extPath = path.join(nodeModulesPath, ext);
  try {
    if (fs.existsSync(extPath)) {
      const packagePath = path.join(extPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        console.log(`   ✅ ${ext}: ${pkg.version}`);
      } else {
        console.log(`   ⚠️  ${ext}: folder exists but no package.json`);
      }
    } else {
      console.log(`   ❌ ${ext}: NOT FOUND`);
    }
  } catch (error) {
    console.log(`   ❌ ${ext}: ERROR - ${error.message}`);
  }
});

console.log('\n=== DIAGNOSTIC COMPLETE ===');