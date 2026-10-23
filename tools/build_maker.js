// Builds the one-file Nightlight Maker: dist/nightlight-maker.html.
// Everything is inside: the editor, the engine art it draws with, and the engine sources that
// "Playtest" and "Export game" put into a game page. Opens straight from disk, no server needed.
//
// Usage: node tools/build_maker.js
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const safe = (s) => String(s).replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

// the engine file list lives in maker/js/engine_files.js
const NL = {};
new Function('window', 'NL', read('maker/js/engine_files.js').replace('window.NL = window.NL || {};', ''))({ NL: NL }, NL);
const sources = {};
for (const f of NL.ENGINE_FILES.concat(['js/main.js', 'css/style.css', 'maker/js/runtime.js', 'maker/js/boot.js'])) sources[f] = read(f);

let html = read('maker/index.html');
const inline = (f) => '<script>/* ' + f + ' */\n' + safe(read(f)) + '\n</script>';
// stylesheet
html = html.replace('<link rel="stylesheet" href="maker.css">', () => '<style>\n' + read('maker/maker.css') + '\n</style>');
// the art files the editor loads with document.write
html = html.replace(/<script src="js\/engine_files\.js"><\/script>\s*<script>NL\.ART_FILES[^\n]*<\/script>/, () =>
  inline('maker/js/engine_files.js') + '\n' + NL.ART_FILES.map(inline).join('\n') + '\n<script>window.NL_SOURCES = ' + safe(JSON.stringify(sources)) + ';</script>');
// the editor's own scripts
html = html.replace(/<script src="(js\/[a-z_]+\.js)"><\/script>/g, (m, f) => inline('maker/' + f));
if (/<script src=/.test(html)) throw new Error('a script was not inlined: ' + html.match(/<script src=[^>]*>/)[0]);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'nightlight-maker.html');
fs.writeFileSync(out, html);
console.log('wrote ' + out + ' ' + Math.round(html.length / 1024) + ' KB');
