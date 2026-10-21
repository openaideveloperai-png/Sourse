// For each chapter, the largest hazard margin (px) that still has a route.
// Smaller = tighter = harder. Usage: node tools/tightness.js [level]
const { execFileSync } = require('child_process');
const lv = process.argv[2] !== undefined ? [process.argv[2]] : ['0', '1', '2', '3', '4', '5', '6'];
for (const i of lv) {
  let best = -1, time = null;
  for (const m of [2, 3, 4, 5, 6, 7, 8, 10]) {
    const out = execFileSync('node', [__dirname + '/solve.js', i, String(m), '120'], { encoding: 'utf8' });
    const r = JSON.parse(out.trim().split(' ').slice(0, -1).join(' '));
    if (r.solved && r.replay && r.replay.ok) { best = m; if (time === null) time = r.time; } else break;
  }
  console.log('level', i, 'max margin', best, 'route time at m=2', time);
}
