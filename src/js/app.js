import 'babel-polyfill';

import '../styles/main.css';

import I from 'immutable';

import React from 'react';
import ReactDOM from 'react-dom';

try {
  PIXI.utils.skipHello();
} catch (err) {
  console.log('PIXI won\'t shut the fuck up because', err);
}

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update');
//   whyDidYouUpdate(React)
// }

import { style, merge } from 'glamor';
import { createElement } from 'glamor/react';
/* @jsx createElement */

import emojis from '../../emojis/emojis.json';

import spriteData from '../../emojis/apple/ios-5.0/64x64.json';
import spriteSheet from '../../emojis/apple/ios-5.0/64x64.png';

const spriteSheets = {
  'ios-5.0': {
    data: require('../../emojis/apple/ios-5.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-5.0/64x64.png'),
  },
  'ios-6.0': {
    data: require('../../emojis/apple/ios-6.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-6.0/64x64.png'),
  },
  'ios-8.3': {
    data: require('../../emojis/apple/ios-8.3/64x64.json'),
    sheet: require('../../emojis/apple/ios-8.3/64x64.png'),
  },
  'ios-9.0': {
    data: require('../../emojis/apple/ios-9.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-9.0/64x64.png'),
  },
  'ios-9.1': {
    data: require('../../emojis/apple/ios-9.1/64x64.json'),
    sheet: require('../../emojis/apple/ios-9.1/64x64.png'),
  },
  'ios-9.3': {
    data: require('../../emojis/apple/ios-9.3/64x64.json'),
    sheet: require('../../emojis/apple/ios-9.3/64x64.png'),
  },
  'ios-10.0': {
    data: require('../../emojis/apple/ios-10.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-10.0/64x64.png'),
  },
};

const spriteSheetTexture = PIXI.Texture.fromImage(spriteSheet);
 
class EmojiRainCanvas extends React.PureComponent {
  state = { drops: null }

  render() {
    return (
      <canvas width={this.props.width} height={this.props.height} />
    );
  }

  getEmojiTextures() {
    return this.props.emojis.map((e) => {
      e = emojis.find(e1 => e1.text === e);
      let frame = spriteData.frames[e.codePoint + '.png'];
      if (frame != null) {
        frame = frame.frame;
        return new PIXI.Texture(spriteSheetTexture, new PIXI.Rectangle(- frame.x, - frame.y, frame.w, frame.h));
      }
    }).filter(t => t).toArray();
  }

  getCarpetDimensions() {
    return {
      rows: Math.ceil(this.props.height / this.props.emojiSize) + 1,
      cols: Math.ceil(this.props.width / this.props.emojiSize) + 1,
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
        sprite.width = this.props.emojiSize * 1.0;
        sprite.height = this.props.emojiSize * 1.0;
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5;
        sprite.position.x = c * this.props.emojiSize - 0.5 * this.props.emojiSize;
        sprite.position.y = r * this.props.emojiSize - 0.5 * this.props.emojiSize;
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
          sprite.width = this.props.emojiSize * 1.0;
          sprite.height = this.props.emojiSize * 1.0;
          sprite.anchor.x = 0.5;
          sprite.anchor.y = 0.5;
          sprite.position.x = c * this.props.emojiSize - 0.5 * this.props.emojiSize;
          sprite.position.y = r * this.props.emojiSize - 0.5 * this.props.emojiSize;
        }
      }
    }

    if (prevProps.tick.step !== this.props.tick.step) {
      const emojiTextures = this.getEmojiTextures();
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
            sprite.width = this.props.emojiSize * 1.0;
            sprite.height = this.props.emojiSize * 1.0;
            sprite.anchor.x = 0.5;
            sprite.anchor.y = 0.5;
            sprite.position.x = c * this.props.emojiSize - 0.5 * this.props.emojiSize;
            sprite.position.y = r * this.props.emojiSize - 0.5 * this.props.emojiSize;
            sprite.alpha = this.state.drops[c] === r ? 1 : 0;
            this._stage.addChild(sprite);
            row.push(sprite);
          }
          if (emojiTextures.length > 0 && this.state.drops[c] === r) {
            sprite.alpha = 1;
            sprite.texture = emojiTextures[Math.floor(Math.random() * emojiTextures.length)];
          } else if (sprite.alpha > 0) {
            sprite.alpha -= 0.05;
            if (emojiTextures.length > 0 && Math.random() < this.props.mutationProb) {
              sprite.texture = emojiTextures[Math.floor(Math.random() * emojiTextures.length)];
            }
          }
        }
      }
      this._renderer.render(this._stage);
    }
  }
}

class EmojiRain extends React.PureComponent {
  static defaultProps = {
    width: 2000,
    height: 1000,
    emojiSize: 24,
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

class Ticker extends React.PureComponent {
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

const tabStyle = style({
  width: '48%',
  cursor: 'pointer',
  display: 'inline-block',
  textAlign: 'center',
  outline: 'none',
  borderRadius: 4,
  fontSize: 18,
});

class EmojiSelectorTabs extends React.PureComponent {
  static defaultProps = {
    value: 'all',

    onChange: () => {},
  }

  handleClick = (value) => {
    this.props.onChange(value);
  }

  render() {
    return (
      <div
        css={{
          margin: '0 0 5px',
          flex: '0 1 auto',
        }}>
        <div {...tabStyle}
          style={{
            marginRight: '2%',
            border: this.props.value === 'all' ? '2px solid #b5e0fe' : 'none',
          }}
          onClick={this.handleClick.bind(null, 'all')}
          tabIndex="0">ALL</div>
        <div {...tabStyle}
          style={{
            marginLeft: '2%',
            border: this.props.value === 'selected' ? '2px solid #b5e0fe' : 'none',
          }}
          onClick={this.handleClick.bind(null, 'selected')}
          tabIndex="0">SELECTED</div>
      </div>
    );
  }
}

class CloseIcon extends React.PureComponent {
  render() {
    return (
      <svg width="40" height="40" viewBox="0 0 40 40">
        <path stroke="#b5e0fe" d="M 10,10 L 30,30 M 30,10 L 10,30" />
      </svg>
    );
  }
}

class SliderIcon extends React.PureComponent {
  render() {
    return (
      <svg width="40" height="40" fill="#b5e0fe" viewBox="0 0 100 100"><path d="M53,61.155c-3.023,0-5.558,2.104-6.234,4.921H27.011c-0.829,0-1.5,0.672-1.5,1.5s0.671,1.5,1.5,1.5h19.757  c0.68,2.813,3.212,4.913,6.232,4.913c3.538,0,6.416-2.879,6.416-6.417S56.538,61.155,53,61.155z M53,70.989  c-1.883,0-3.414-1.529-3.417-3.41c0-0.001,0-0.002,0-0.003c0-0.002,0-0.005,0-0.007c0.001-1.883,1.534-3.414,3.417-3.414  s3.416,1.533,3.416,3.417S54.884,70.989,53,70.989z M27.01,32.927h23.756c0.678,2.816,3.212,4.918,6.232,4.918  c3.538,0,6.417-2.879,6.417-6.418c0-3.538-2.879-6.416-6.417-6.416c-3.021,0-5.555,2.101-6.232,4.916H27.01  c-0.829,0-1.5,0.671-1.5,1.5S26.182,32.927,27.01,32.927z M56.999,28.011c1.884,0,3.417,1.532,3.417,3.416  c0,1.885-1.533,3.418-3.417,3.418s-3.417-1.533-3.417-3.418C53.582,29.543,55.115,28.011,56.999,28.011z M67.915,32.927h5.072  c0.828,0,1.5-0.671,1.5-1.5s-0.672-1.5-1.5-1.5h-5.072c-0.828,0-1.5,0.671-1.5,1.5S67.087,32.927,67.915,32.927z M72.988,48H49.832  c-0.829,0-1.5,0.671-1.5,1.5s0.671,1.5,1.5,1.5h23.156c0.828,0,1.5-0.672,1.5-1.5S73.816,48,72.988,48z M27.01,50.998h5.756  c0.678,2.816,3.211,4.918,6.233,4.918c3.539,0,6.417-2.879,6.417-6.417c0-3.539-2.878-6.417-6.417-6.417  c-3.021,0-5.554,2.101-6.232,4.917H27.01c-0.829,0-1.5,0.671-1.5,1.5S26.182,50.998,27.01,50.998z M39,46.082  c1.884,0,3.417,1.533,3.417,3.417S40.884,52.916,39,52.916s-3.417-1.532-3.417-3.417S37.115,46.082,39,46.082z M72.988,66.072  h-9.072c-0.828,0-1.5,0.672-1.5,1.5s0.672,1.5,1.5,1.5h9.072c0.828,0,1.5-0.672,1.5-1.5S73.816,66.072,72.988,66.072z"></path></svg>

    );
  }
}

class EmojiSelectorEmoji extends React.PureComponent {
  static defaultProps = {
    handleSelect: () => {},
  }

  handleKeyPress = (ev) => {
    if (ev.which === 13) {
      this.handleClick(ev);
    }
  }

  handleClick = (ev) => {
    this.props.onSelect(ev);
  }

  render() {
    const { emoji, selected, showAll } = this.props;
    const src = process.publicPath + 'assets/emojis/apple/24x24/' + emoji.codePoint + '.png';
    let frame = spriteData.frames[emoji.codePoint + '.png'];
    if (frame != null) {
      frame = frame.frame;
    }
    const spriteBackgroundSize = Math.floor(spriteData.meta.width / frame.w * 100).toString() + '%';
    return (
      <a
        href="#"
        key={emoji.text}
        data-emoji={emoji.text}
        onClick={this.handleClick}
        onKeyPress={this.handleKeyPress}
        css={{
          display:  showAll ? 'inline-block' : selected ? 'inline-block' : 'none',
          cursor: 'pointer',
          position: 'relative',
          width: 46,
          height: 46,
          margin: 2,
          borderRadius: 4,
          backgroundColor: selected ? '#b5e0fe' : 'transparent',
          verticalAlign: 'top',
          transition: 'background-color 250ms ease-out',
          ':focus': {
            border: '1px solid #b5e0fe',
          },
          ':hover': {
            border: '1px solid #b5e0fe',
          },
          outline: 'none',
        }}>
          <div
            css={{
              width: 30,
              height: 30,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              userSelect: 'none',
              outline: 0,
              transition: 'opacity 250ms ease-out',
              backgroundSize: spriteBackgroundSize,
              backgroundImage: `url(${spriteSheet})`,
            }}
            style={{
              backgroundPosition: frame != null ? `${frame.x * (30/frame.w)}px ${frame.y * (30/frame.h)}px` : null,
              opacity: selected ? 1 : 0.8,
            }}
            // NOTE(brian): why is img sometimes the target of the event? :3
            data-emoji={emoji.text}
            />
      </a>
    );
  }
}

class EmojiSelector extends React.PureComponent {
  static defaultProps = {
    selected: [],
    onSelect: () => {},
  }

  state = {
    tab: 'all',
  }

  handleTabChange = (tab) => {
    this.setState({ tab });
  }

  handleEmojiSelect = (ev) => {
    const emoji = ev.target.dataset.emoji;
    if (this.props.selected.includes(emoji)) {
      this.props.onSelect(this.props.selected.remove(emoji));
    } else {
      this.props.onSelect(this.props.selected.add(emoji));
    }
  }

  render() {
    return (
      <div css={{ display: 'flex', flex: '1 1 auto', flexFlow: 'column', margin: '10px 0' }}>
        <div css={{ flex: '0 1 auto', fontSize: 16, fontWeight: 'bold' }}>Choose Emojis:</div>
        <EmojiSelectorTabs value={this.state.tab} onChange={this.handleTabChange} />
        <div css={{
          padding: 20,
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto',
          border: '2px solid #b5e0fe',
          borderRadius: 4,
          flex: '1 1 auto',
        }}>
          {emojis.filter((e) => spriteData.frames[e.codePoint + '.png'] != null).map((e) => {
            const selected = this.props.selected.includes(e.text);
            return (
              <EmojiSelectorEmoji
                key={e.text}
                emoji={e}
                selected={selected}
                showAll={this.state.tab === 'all'}
                onSelect={this.handleEmojiSelect} />
            );
          })}
        </div>
      </div>
    );
  }
}

class LabeledSlider extends React.PureComponent {
  static defaultProps = {
    onChange: () => {},
  }

  render() {
    return (
      <div css={{ width: '100%' }}>
        <div css={{ fontSize: 16, fontWeight: 'bold' }}>{this.props.label}:</div>
        <div css={{ position: 'relative', fontSize: 12 }}>
          <div css={{ position: 'relative', left: 0 }}>{this.props.minLabel}</div>
          <div css={{ position: 'absolute', right: 0, top: 0 }}>{this.props.maxLabel}</div>
        </div>
        <input
          css={{ display: 'block', width: '100%' }}
          type="range" min={this.props.min} max={this.props.max}
          step={this.props.step}
          value={this.props.value}
          onChange={this.props.onChange} />
      </div>
    );
  }
}

function linear(t, b, c, d) {
  return c * t / d + b;
}

class EmojiRainApp extends React.PureComponent {
  state = {
    viewport: { width: 0, height: 0 },
    selectedEmojis: I.Set(emojis.slice(0, 10).map(e => e.text)),
    emojiSize: 24,
    fallProb: 0.005,
    mutationProb: 0.025,
    refreshRate: 80,
    paneIsOpen: false,
  }

  handleSelect = (selected) => {
    this.setState({ selectedEmojis: selected });
  }

  togglePane = () => {
    this.setState({ paneIsOpen: !this.state.paneIsOpen });
  }

  render() {
    return (
      <div>
        <div css={{ position: 'fixed', top: 0, left: 0 }}>
          <EmojiRain
            {...this.state.viewport}
            emojis={this.state.selectedEmojis}
            emojiSize={this.state.emojiSize}
            fallProb={this.state.fallProb}
            mutationProb={this.state.mutationProb}
            refreshRate={this.state.refreshRate}
            />
        </div>
        <div css={{ position: 'relative' }}>
          <div css={{
            display: 'flex',
            flexFlow: 'column',
            position: 'relative',
            top: 0, left: 0,
            width: 500,
            height: '100vh',
            fontSize: 30,
            padding: '5px 20px 20px',
            backgroundColor: 'rgba(200, 123, 204, 0.8)',
            color: 'rgb(181, 224, 254)',
            transform: this.state.paneIsOpen ? 'none' : 'translateX(-100%)',
            transition: 'transform 400ms ease-out',
          }}>
            <div css={{
              flex: '0 1 auto',
              position: 'relative',
              top: 0, left: -8,
              marginBottom: -12,
              outline: 0,
              cursor: 'pointer',
            }}
              tabIndex="0"
              onClick={this.togglePane}
            >
              <CloseIcon />
            </div>
            <div css={{
              flex: '0 1 auto',
              marginBottom: 5,
            }}>
              <h1 css={{ fontSize: 30, fontWeight: 'bold', display: 'inline' }}>Emoji Rain</h1>
              {'\u00a0'}
              <h2 css={{ fontSize: 12, display: 'inline' }}>(Like that green Matrix rain except with emojis)</h2>
            </div>
            <EmojiSelector selected={this.state.selectedEmojis} onSelect={this.handleSelect} />
            <div css={{
              position: 'relative',
              flex: '0 1 auto',
              paddingTop: 40,
            }}>
              <LabeledSlider 
                label="Intensity"
                minLabel="Lighter"
                min={0}
                maxLabel="Heavier"
                max={0.01}
                step={0.0005}
                value={this.state.fallProb}
                onChange={ev => this.setState({ fallProb: ev.target.value })}
              />
              <LabeledSlider 
                label="Mutation Rate"
                minLabel="Fewer"
                min={0}
                maxLabel="More"
                max={0.08}
                step={0.001}
                value={this.state.mutationProb}
                onChange={ev => this.setState({ mutationProb: ev.target.value })}
              />
              <LabeledSlider 
                label="Speed"
                minLabel="Slower"
                min={0}
                maxLabel="Faster"
                max={1}
                step={0.01}

                // my brain hurts: trying to get a slider that linearly tweens from 150 (slow) to 20 (fast)
                // value={linear(this.state.refreshRate, 0, 1, 130)}
                value={1 - linear(this.state.refreshRate - 20, 0, 1, 130)}
                onChange={ev => {
                  this.setState({ refreshRate: linear(ev.target.value, 150, -130, 1) });
                }}
              />
              <LabeledSlider
                label="Emoji Size"
                minLabel="Smaller"
                min={20}
                maxLabel="Larger"
                max={40}
                value={this.state.emojiSize}
                onChange={ev => this.setState({ emojiSize: ev.target.value })} 
              />
            </div>
            <div css={{ flex: '0 1 auto', fontSize: 10, paddingTop: 30 }}>
              Created by <a href="https://twitter.com/bravebriankim" css={{
                color: '#fff',
              }}>Brian Kim</a>
            </div>
          </div>
          <div css={{
            position: 'absolute',
            top: 0, left: -8,
            padding: '5px 20px 20px',
            opacity: this.state.paneIsOpen ? 0 : 1,
            outline: 0,
            cursor: 'pointer',
          }}
            tabIndex="0"
            onClick={this.togglePane}
          >
            <SliderIcon />
          </div>
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

class EmojiChangelogCanvas extends React.PureComponent {
  componentDidMount() {
    const el = ReactDOM.findDOMNode(this);

    const renderer = this._renderer = PIXI.autoDetectRenderer(this.props.width, this.props.height, {
      transparent: true,
      view: el,
    });
    const stage = this._stage = new PIXI.Container();

    const spriteSheetTexture = PIXI.Texture.fromImage(spriteSheets[this.props.version].sheet);
    const textures = emojis.map((e) => {
      let frame = spriteSheets[this.props.version].data.frames[e.codePoint + '.png'];
      if (frame != null) {
        frame = frame.frame;
        const texture = new PIXI.Texture(spriteSheetTexture, new PIXI.Rectangle(- frame.x, - frame.y, frame.w, frame.h));
        return {
          ...e,
          texture,
        };
      }
    }).filter(t => t);

    const spriteMap = this._spriteMap = {};
    const rows = Math.floor(this.props.height / 30);
    const cols = Math.floor(this.props.width / 30);
    for (let i = 0; i < textures.length; i++) {
      const {text, texture} = textures[i];
      const sprite = new PIXI.Sprite(texture);
      sprite.width = 30;
      sprite.height = 30;
      sprite.position.x = 30 * (i % cols);
      sprite.position.y = 30 * Math.floor(i / rows);
      spriteMap[text] = sprite;
      stage.addChild(sprite);
    }
    setTimeout(() => { renderer.render(stage); }, 100);
  }

  componentDidUpdate(prevProps) {
    const stage = this._stage;
    const renderer = this._renderer;
    const spriteMap = this._spriteMap;
 
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this._renderer.resize(this.props.width, this.props.height);
    }

    const spriteSheetTexture = PIXI.Texture.fromImage(spriteSheets['ios-5.0'].sheet);
    const textures = emojis.map((e) => {
      let frame = spriteSheets['ios-5.0'].data.frames[e.codePoint + '.png'];
      if (frame != null) {
        frame = frame.frame;
        const texture = new PIXI.Texture(spriteSheetTexture, new PIXI.Rectangle(- frame.x, - frame.y, frame.w, frame.h));
        return {
          ...e,
          texture,
        };
      }
    }).filter(t => t);
    const cols = Math.floor(this.props.width / 30);
    for (let i = 0; i < textures.length; i++) {
      const {text, texture} = textures[i];
      const sprite = spriteMap[text] || new PIXI.Sprite(texture);
      sprite.width = 30;
      sprite.height = 30;
      sprite.position.x = 30 * (i % cols);
      sprite.position.y = 30 * Math.floor(i / cols);
      spriteMap[text] = sprite;
    }
    setTimeout(() => { renderer.render(stage); }, 100);
  }

  render() {
    const { width, height } = this.props;
    return (
      <canvas style={{ border: '1px solid white' }} width={width} height={height} />
    );
  }
}

class EmojiChangelogApp extends React.PureComponent {
  state = {
    viewport: { width: 0, height: 0 },
    version: 'ios-5.0',
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

  handleVersionChange = (ev) => {
    this.setState({ version: ev.target.value });
  }

  render() {
    const { viewport } = this.state;
    return (
      <div value="1">
        <EmojiChangelogCanvas width={viewport.width} height={viewport.height} version={this.state.version}/>
        <select value={this.state.version} onChange={this.handleVersionChange}>
          <option value="ios-5.0">5.0</option>
          <option value="ios-6.0">6.0</option>
          <option value="ios-8.3">8.3</option>
          <option value="ios-9.0">9.0</option>
          <option value="ios-9.1">9.1</option>
          <option value="ios-9.3">9.3</option>
          <option value="ios-10.0">10.0</option>
        </select>
      </div>
    );
  }
}

ReactDOM.render(<EmojiChangelogApp />, document.getElementById('app'));
