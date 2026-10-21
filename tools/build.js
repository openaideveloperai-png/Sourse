// Bundles index.html + css + js into one self-contained HTML file.
//   node tools/build.js            -> dist/wrong-way-home.html (open it directly)
//   node tools/build.js --artifact <out.html>  -> body-only page for hosting in an iframe shell
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const js = scripts.map((s) => '// ---- ' + s + ' ----\n' + fs.readFileSync(path.join(root, s), 'utf8')).join('\n');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script')).trim();
const art = process.argv.indexOf('--artifact');
if (art >= 0) {
  const out = process.argv[art + 1];
  const page = '<title>Wrong Way Home</title>\n<style>\n' + css + '\n</style>\n' + body + '\n<script>\n' + js + '\n</script>\n';
  fs.writeFileSync(out, page);
  console.log('wrote', out, (page.length / 1024).toFixed(0) + ' KB');
} else {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  const page = html
    .replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
    .replace(/(<script src="[^"]+"><\/script>\n?)+/, '<script>\n' + js.replace(/<\/script>/g, '<\\/script>') + '\n</script>\n');
  const out = path.join(root, 'dist/wrong-way-home.html');
  fs.writeFileSync(out, page);
  console.log('wrote', out, (page.length / 1024).toFixed(0) + ' KB');
}
