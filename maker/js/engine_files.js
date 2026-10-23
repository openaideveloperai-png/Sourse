// The NOBODY HOME engine files a Nightlight game needs, in load order (paths from the repo root).
// Used by maker/play.html and by "Export game". The game's own story files are not included.
window.NL = window.NL || {};
NL.ENGINE_FILES = [
  'js/core.js', 'js/art/lib.js', 'js/art/tiles.js', 'js/art/furniture.js', 'js/art_kid.js', 'js/art/chars_main.js',
  'js/art/caretaker.js', 'js/art/cast.js', 'js/art/danchi.js', 'js/art/props.js', 'js/art/extra.js', 'js/art/pics.js',
  'js/art/props2.js', 'js/art/outdoor.js', 'js/art/icons.js', 'js/art/fixes.js', 'js/fx.js', 'js/audio.js', 'js/ui.js',
  'js/engine/world.js', 'js/engine/events.js', 'js/engine/chase.js', 'js/engine/explore.js', 'js/engine/menus.js',
];
// what the editor needs: the art to draw rooms, and the sound bank to preview sounds
NL.ART_FILES = NL.ENGINE_FILES.filter((f) => f.indexOf('js/art') === 0 || f === 'js/core.js' || f === 'js/audio.js');
