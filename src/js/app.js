import 'babel-polyfill';

import '../styles/reset.css';

import React from 'react';
import ReactDOM from 'react-dom';

import appleColorEmoji from '../spritesheets/apple-color-emoji-20.json';
import appleColorEmojiSrc from '../spritesheets/apple-color-emoji-20.png';

import twemoji from 'twemoji';
import runes from 'runes';

class EmojiRainCanvas extends React.Component {
  state = { drops: null }

  render() {
    return (
      <canvas width={this.props.width} height={this.props.height} />
    );
  }

  getEmojiTextures() {
    return runes(this.props.emojis).map((e) => {
      const codePoint = twemoji.convert.toCodePoint(e);
      let src;
      try {
        src = require('../emoji/apple-color-emoji/' + codePoint + '.png');
        // src = require('../emoji/twitter/' + codePoint + '.png');
        return PIXI.Texture.fromImage(src);
      } catch (err) {
        console.log(err);
      }
    }).filter(t => t);
  }

  getCarpetDimensions() {
    return {
      rows: Math.ceil(this.props.height / this.props.emojiSize),
      cols: Math.ceil(this.props.width / this.props.emojiSize),
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
        nextDrop = Math.random() < this.props.fallProb * 10 ? Math.floor(Math.random() * rows) : Infinity;
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

  componentWillReceiveProps(nextProps) {
    if (this.props.tick.step !== nextProps.tick.step) {
      this.setState({ drops: this.incrementDrops(this.state.drops) });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this._renderer.resize(this.props.width, this.props.height);
    }

    const {rows, cols} = this.getCarpetDimensions();
    const spriteCarpet = this._spriteCarpet;

    if (prevProps.emojiSize !== this.props.emojiSize) {
      for (let r = 0; r < spriteCarpet.length; r++) {
        const row = spriteCarpet[r];
        for (let c = 0; c < row.length; c++) {
          const sprite = row[c];
          sprite.width = this.props.emojiSize;
          sprite.height = this.props.emojiSize;
          sprite.position.x = c * this.props.emojiSize;
          sprite.position.y = r * this.props.emojiSize;
        }
      }
    }

    if (prevProps.tick.step !== this.props.tick.step) {
      const emojis = this.getEmojiTextures();
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
            sprite.alpha = this.state.drops[c] === r ? 1 : 0;
            this._stage.addChild(sprite);
            row.push(sprite);
          }
          if (emojis.length > 0 && this.state.drops[c] === r) {
            sprite.alpha = 1;
            sprite.texture = emojis[Math.floor(Math.random() * emojis.length)];
          } else if (sprite.alpha > 0) {
            sprite.alpha -= 0.05;
            if (emojis.length > 0 && Math.random() < this.props.mutationProb) {
              sprite.texture = emojis[Math.floor(Math.random() * emojis.length)];
            }
          }
        }
      }
      this._renderer.render(this._stage);
    }
  }
}

class EmojiRain extends React.Component {
  static defaultProps = {
    width: 2000,
    height: 1000,
    emojiSize: 20,
    emojis: "😀😬😂😃😄😅😆😇😉😊☺️😋😌😍😘😗😙😚😜😝😛😎😏😶😐😑😒😳😞😟😠😡😔😕😣😖😫😩😤😮😱😨😰😯😦😧😢😥😪😓😭😲😷😴💩😈👿👹👺💀👻👽👀",
    fallProb: 0.005,
    mutationProb: 0.05,
    refreshRate: 80,
  }

  render() {
    return (
      <Ticker refreshRate={this.props.refreshRate}>
        <EmojiRainCanvas {...this.props} />
      </Ticker>
    );
  }
}

class Ticker extends React.Component {
  state = {
    start: null,
    last: null,
    step: 0,
  };

  render() {
    const child = React.Children.only(this.props.children)
    return React.cloneElement(child, {...child.props, tick: this.state});
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

class Slider extends React.Component {
  render() {
    return <div/>
  }
}

class EmojiForm extends React.Component {
  state = {
    emojis: "😀😬😂😃😄😅😆😇😉😊☺️😋😌😍😘😗😙😚😜😝😛😎😏😶😐😑😒😳😞😟😠😡😔😕😣😖😫😩😤😮😱😨😰😯😦😧😢😥😪😓😭😲😷😴💩😈👿👹👺💀👻👽👀",
    emojiSize: 20,
    fallProb: 0.005,
    mutationProb: 0.005,
    refreshRate: 80,
  }

  render() {
    return (
      <div>
      </div>
    );
  }
}

class App extends React.Component {
  state = {
    viewport: { width: 0, height: 0 },
    emojis: "😀😬",
    emojiSize: 20,
    fallProb: 0.005,
    mutationProb: 0.005,
    refreshRate: 80,
  }

  render() {
    const inputStyle = {
      display: 'block',
      width: 500,
    };
    return (
      <div>
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <EmojiRain
            {...this.state.viewport}
            emojis={this.state.emojis}
            emojiSize={this.state.emojiSize}
            fallProb={this.state.fallProb}
            mutationProb={this.state.mutationProb}
            refreshRate={this.state.refreshRate}
            />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, fontSize: 30}}>
          <input style={inputStyle} style={{font: 'inherit'}} type="text" value={this.state.emojis} onChange={ev => this.setState({ emojis: ev.target.value })}/>
          <input style={inputStyle} type="range" min={0} max={0.01} step={0.0005} value={this.state.fallProb} onChange={ev => this.setState({ fallProb: ev.target.value }) } />
          <input style={inputStyle} type="range" min={0} max={0.05} step={0.001} value={this.state.mutationProb} onChange={ev => this.setState({ mutationProb: ev.target.value })} /> 
          <input style={inputStyle} type="range" min={20} max={200} value={this.state.refreshRate} onChange={ev => this.setState({ refreshRate: ev.target.value })} />
          <input style={inputStyle} type="range" min={20} max={72} value={this.state.emojiSize} onChange={ev => this.setState({ emojiSize: ev.target.value })} />
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
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
