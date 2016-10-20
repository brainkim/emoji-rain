import 'babel-polyfill';
import happyFace from '../../apple-color-emoji/1f600.png';
import relievedFace from '../../apple-color-emoji/1f60c.png'; 

const emojiSize = 20;

const renderer = PIXI.autoDetectRenderer(1000, 500, {
  transparent: true,
});
renderer.view.style.border = '1px solid black';

const stage = new PIXI.Container();

const happyFaceTx = PIXI.Texture.fromImage(happyFace);
const relievedFaceTx = PIXI.Texture.fromImage(relievedFace);

document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(renderer.view);
  requestAnimationFrame(animate);
});

const rows = 500 / emojiSize;
const cols = 1000 / emojiSize;

const drops = [];
for (let c = 0; c < cols; c++) {
  drops.push(Math.floor(Math.random() * rows));
}

const sprites = [];
for (let r = 0; r < rows; r++) {
  const row = [];
  sprites.push(row);
  for (let c = 0; c < cols; c++) {
    const sprite = new PIXI.Sprite(happyFaceTx);
    sprite.width = emojiSize;
    sprite.height = emojiSize;
    sprite.anchor.x = 0;
    sprite.anchor.y = 0;
    sprite.position.x = c * emojiSize;
    sprite.position.y = r * emojiSize;

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

  const step = Math.floor(elapsed / 100);
  if (prevStep == null || prevStep != step) {
    for (let c = 0; c < drops.length; c++) {
      drops[c] += 1; 
      if (drops[c] > 500 / emojiSize && Math.random() > 0.99) {
        drops[c] = 0;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const sprite = sprites[r][c];
        if (drops[c] === r) {
          sprite.alpha = 1;
        } else {
          sprite.alpha = 0;
        }
      }
    }
    renderer.render(stage);
  }

  prevStep = step;
}
