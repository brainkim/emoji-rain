import 'babel-polyfill';

import spliddit from 'spliddit';
import '../styles/reset.css';

function toCodePoint(unicodeSurrogates, sep) {
  var
    r = [],
    c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
      p = 0;
    } else if (0xD800 <= c && c <= 0xDBFF) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join(sep || '-');
}

const emojis = spliddit("😀😬😂😃😄😅😆😇😉😊☺️😋😌😍😘😗😙😚😜😝😛😎😏😶😐😑😒😳😞😟😠😡😔😕😣😖😫😩😤😮😱😨😰😯😦😧😢😥😪😓😭😲😷😴💩😈👿👹👺💀👻👽👀").map((e) => {
  const codePoint = toCodePoint(e);
  let url;
  try {
    url = require('../../apple-color-emoji/' + codePoint + '.png');
  } catch (err) {
    console.log(JSON.stringify(e), err);
  }
  return url ? PIXI.Texture.fromImage(url) : null;
}).filter((i) => i);

const emojiSize = 20;
const width = 2000;
const height = 1000;

const renderer = PIXI.autoDetectRenderer(width, height, {
  transparent: true,
});
renderer.view.style.border = '1px solid black';
renderer.view.style.backgroundColor = 'black';

const stage = new PIXI.Container();


document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(renderer.view);
  requestAnimationFrame(animate);
});

const rows = height / emojiSize;
const cols = width / emojiSize;

const drops = [];
for (let c = 0; c < cols; c++) {
  drops.push(Math.random() < 0.005 ? Math.floor(Math.random() * rows) : rows + 1);
}

const sprites = [];
for (let r = 0; r < rows; r++) {
  const row = [];
  sprites.push(row);
  for (let c = 0; c < cols; c++) {
    const sprite = new PIXI.Sprite();
    sprite.width = emojiSize;
    sprite.height = emojiSize;
    sprite.anchor.x = 0;
    sprite.anchor.y = 0;
    sprite.position.x = c * emojiSize;
    sprite.position.y = r * emojiSize;
    sprite.alpha = drops[c] === r ? 1 : 0;

    stage.addChild(sprite);
    row.push(sprite);
  }
}

let startTime = null;
let prevStep = null;
function animate(time) {
  requestAnimationFrame(animate);

  let elapsed;
  if (startTime == null) {
    startTime = time;
    elapsed = 0;
  } else {
    elapsed = time - startTime;
  }

  const step = Math.floor(elapsed / 80);
  if (prevStep == null || prevStep != step) {
    for (let c = 0; c < drops.length; c++) {
      drops[c] += 1; 
      if (drops[c] > rows && Math.random() > 0.995) {
        drops[c] = 0;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sprite = sprites[r][c];
        if (drops[c] === r) {
          sprite.alpha = 1;
          sprite.texture = emojis[Math.floor(Math.random() * emojis.length)];
        } else if (sprite.alpha > 0) {
          sprite.alpha -= 0.05;
          if (Math.random() < 0.02) {
            sprite.texture = emojis[Math.floor(Math.random() * emojis.length)];
          }
        }
      }
    }
    renderer.render(stage);
  }

  prevStep = step;
}
