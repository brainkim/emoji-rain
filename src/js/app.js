import 'babel-polyfill';

import '../styles/reset.css';

import React from 'react';
import ReactDOM from 'react-dom';

import spliddit from 'spliddit';
import emojiData from '../../emoji-data/emoji.json';
import appleColorEmoji from '../../emoji-data/sheet_apple_20.png';

const appleColorEmojiTx = new PIXI.Texture.fromImage(appleColorEmoji);
const textures = emojiData.reduce((textures, e) => {
  if (e.has_img_apple) {
    const rect = new PIXI.Rectangle(e.sheet_x * 20, e.sheet_y * 20, 20, 20);
    textures[e.unified] = new PIXI.Texture(appleColorEmojiTx, rect);
  }
  return textures;
}, {});

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
  const codePoint = toCodePoint(e).toUpperCase();
  return textures[toCodePoint(e).toUpperCase()];
}).filter((t) => t);

class EmojiRain extends React.Component {
  static defaultProps = {
    width: 2000,
    height: 1000,
    emojiSize: 20,
    emojis: "😀😬😂😃😄😅😆😇😉😊☺️😋😌😍😘😗😙😚😜😝😛😎😏😶😐😑😒😳😞😟😠😡😔😕😣😖😫😩😤😮😱😨😰😯😦😧😢😥😪😓😭😲😷😴💩😈👿👹👺💀👻👽👀",
    fallProb: 0.005,
    refreshRate: 80,
    mutationProb: 0.02,
  }

  render() {
    return <canvas />;
  }

  getCarpetDimensions(props) {
    props = props || this.props;
    return {
      rows: Math.ceil(props.height / props.emojiSize),
      cols: Math.ceil(props.width / props.emojiSize),
    }
  }

  incrementDrops(prevDrops) {
    prevDrops = prevDrops || [];
    const {rows, cols} = this.getCarpetDimensions();
    const nextDrops = [];
    for (let c = 0; c < cols; c++) {
      const prevDrop = prevDrops[c];
      let nextDrop;
      if (prevDrop == null) {
        nextDrop = Math.random() < this.props.fallProb * 10 ? Math.floor(Math.random() * rows) : rows + 1;
      } else {
        nextDrop = prevDrops[c] + 1;
        if (nextDrop > rows && Math.random() < this.props.fallProb) {
          nextDrop = 0;
        }
      }
      nextDrops.push(nextDrop);
    }
    return nextDrops;
  }

  componentDidMount() {
    const el = ReactDOM.findDOMNode(this);
    const renderer = this._renderer = PIXI.autoDetectRenderer(this.props.width, this.props.height, {
      transparent: true,
      view: el,
    });
    const stage = this._stage = new PIXI.Container();

    const {rows, cols} = this.getCarpetDimensions();
    const drops = this.incrementDrops();

    const spriteCarpet = this._spriteCarpet = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      spriteCarpet.push(row);
      for (let c = 0; c < cols; c++) {
        const sprite = new PIXI.Sprite();
        sprite.width = this.props.emojiSize;
        sprite.height = this.props.emojiSize;
        sprite.position.x = c * this.props.emojiSize;
        sprite.position.y = r * this.props.emojiSize;
        sprite.alpha = drops[c] === r ? 1 : 0;

        stage.addChild(sprite);
        row.push(sprite);
      }
    }

    renderer.render(stage);

    this.setState({ drops });
  }
  
  componentDidUpdate(prevProps) {
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this._renderer.resize(this.props.width, this.props.height);
    }
    if (prevProps.step !== this.props.step) {
      const {rows, cols} = this.getCarpetDimensions();
      const spriteCarpet = this._spriteCarpet;
      const drops = this.incrementDrops(this.state.drops);
      for (let r = 0; r < rows; r++) {
        let row = spriteCarpet[r];
        if (row == null) {
          row = [];
          spriteCarpet.push(row)
        }
        for (let c = 0; c < cols; c++) {
          let sprite = row[c];
          if (sprite == null) {
            sprite = new PIXI.Sprite();
            sprite.width = this.props.emojiSize;
            sprite.height = this.props.emojiSize;
            sprite.position.x = c * this.props.emojiSize;
            sprite.position.y = r * this.props.emojiSize;
            sprite.alpha = drops[c] === r ? 1 : 0;
            this._stage.addChild(sprite);
            row.push(sprite);
          }
          if (drops[c] === r) {
            sprite.alpha = 1;
            sprite.texture = emojis[Math.floor(Math.random() * emojis.length)];
          } else if (sprite.alpha > 0) {
            sprite.alpha -= 0.05;
            if (Math.random() < this.props.mutationProb) {
              sprite.texture = emojis[Math.floor(Math.random() * emojis.length)];
            }
          }
        }
      }
      this._renderer.render(this._stage);
      this.setState({ drops });
    }
  }
}

class Ticker extends React.Component {
  static defaultProps = {
    width: 2000,
    height: 1000,
    emojiSize: 20,
    emojis: "😀😬😂😃😄😅😆😇😉😊☺️😋😌😍😘😗😙😚😜😝😛😎😏😶😐😑😒😳😞😟😠😡😔😕😣😖😫😩😤😮😱😨😰😯😦😧😢😥😪😓😭😲😷😴💩😈👿👹👺💀👻👽👀",
    fallProb: 0.005,
    refreshRate: 80,
    mutationProb: 0.02,
  }

  state = {
    start: null,
    last: null,
    step: 0,
  };

  render() {
    return (
      <EmojiRain {...this.props} step={this.state.step} />
    );
  }

  componentDidMount() {
    requestAnimationFrame(this.tick);
  } 

  componentWillUnmount() {
    cancelAnimationFrame(this.tick);
  }

  tick = (now) => {
    requestAnimationFrame(this.tick);
    if (this.state.last == null) {
      this.setState({
        start: now,
        last: now,
        step: 0,
      });
    } else {
      const elapsed = now - this.state.last;
      if (elapsed >= this.props.refreshRate) {
        this.setState({
          last: now,
          step: Math.floor((now - this.state.start) / this.props.refreshRate)
        });
      }
    }
  }
}

class App extends React.Component {
  state = {
    viewport: { width: 0, height: 0 }
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  render() {
    return (
      <Ticker width={this.state.viewport.width} height={this.state.viewport.height} />
    );
  }

  handleResize = () => {
    this.setState({
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      },
    });
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
