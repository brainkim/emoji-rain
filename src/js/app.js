import 'babel-polyfill';

import '../styles/main.css';

import I from 'immutable';

import React from 'react';
import ReactDOM from 'react-dom';

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update');
//   whyDidYouUpdate(React)
// }

import { style, merge } from 'glamor';
import { createElement } from 'glamor/react';
/* @jsx createElement */

import emojis from '../../emojis/emojis.json';

class EmojiRainCanvas extends React.PureComponent {
  state = { drops: null }

  render() {
    return (
      <canvas width={this.props.width} height={this.props.height} />
    );
  }

  getEmojiTextures() {
    return this.props.emojis.map((e) => {
      const src = process.publicPath + 'assets/emojis/apple/24x24/'+ e.codePoint + '.png';
      return PIXI.Texture.fromImage(src);
    }).filter(t => t);
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
  width: '50%',
  cursor: 'pointer',
  display: 'inline-block',
  textAlign: 'center',
  outline: 'none',
  ':focus': {
  },
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
          marginBottom: 20,
          width: '100%',
          position: 'relative',
          top: 0,
          left: 0,
        }}>
        <div {...tabStyle}
          onClick={this.handleClick.bind(null, 'all')}
          tabIndex="0">All</div>
        <div {...tabStyle}
          onClick={this.handleClick.bind(null, 'active')}
          tabIndex="0">Active</div>
        <div css={{
          position: 'relative',
          width: '50%',
          left: this.props.value === 'all' ? 0 : '50%',
          transition: 'left 0.5s ease-in-out',
          backgroundColor: '#b5e0fe',
          height: 5,
          borderRadius: 2,
          transition: 'left 0.5s ease-in-out',
        }} />
      </div>
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

  handleKeyPress = (ev) => {
    if (ev.which === 13) {
      this.handleClick(ev);
    }
  }

  handleClick = (ev) => {
    const emoji = ev.target.dataset.emoji;
    if (this.props.selected.includes(emoji)) {
      this.props.onSelect(this.props.selected.remove(emoji));
    } else {
      this.props.onSelect(this.props.selected.add(emoji));
    }
  }

  render() {
    return (
      <div
        css={{
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        }}>
        <EmojiSelectorTabs value={this.state.tab} onChange={this.handleTabChange} />
        <div css={{
          width: 500,
          maxHeight: 400,
          padding: 20,
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'scroll',
        }}>
          {emojis.filter((e) => e.hasApple).map((e, i) => {
            const src = process.publicPath + 'assets/emojis/apple/24x24/' + e.codePoint + '.png';
            const isSelected = this.props.selected.includes(e.text);
            return (
              <div
                key={e.text}
                data-emoji={e.text}
                tabIndex="0"
                onClick={this.handleClick}
                onKeyPress={this.handleKeyPress}
                css={{
                  display: this.state.tab === 'all' ? 'inline-block' : isSelected ? 'inline-block' : 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  width: 46,
                  height: 46,
                  margin: 2,
                  borderRadius: 4,
                  backgroundColor: isSelected ? '#b5e0fe' : 'transparent',
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
                  <img
                    src={src}
                    css={{
                      width: 30,
                      height: 30,
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      userSelect: 'none',
                      opacity: isSelected ? 1 : 0.6,
                      outline: 0,
                      transition: 'opacity 250ms ease-out',
                    }}
                    alt={e.text}
                    // NOTE(brian): why is img sometimes the target of the event? :3
                    data-emoji={e.text}
                    />
                </div>
            );
          })}
        </div>
      </div>
    );
  }
}

class App extends React.PureComponent {
  state = {
    viewport: { width: 0, height: 0 },
    selectedEmojis: I.Set(emojis.slice(0, 10).map(e => e.text)),
    emojiSize: 24,
    fallProb: 0.005,
    mutationProb: 0.025,
    refreshRate: 80,
  }

  handleSelect = (selected) => {
    this.setState({ selectedEmojis: selected });
  }

  render() {
    const inputStyle = {
      display: 'block',
      width: 500,
    };

    return (
      <div>
        <div css={{ position: 'absolute', top: 0, left: 0 }}>
          <EmojiRain
            {...this.state.viewport}
            emojis={emojis.filter(e => this.state.selectedEmojis.includes(e.text))}
            emojiSize={this.state.emojiSize}
            fallProb={this.state.fallProb}
            mutationProb={this.state.mutationProb}
            refreshRate={this.state.refreshRate}
            />
        </div>
        <div css={{ position: 'absolute', top: 0, left: 0, fontSize: 30}}>
          <EmojiSelector selected={this.state.selectedEmojis} onSelect={this.handleSelect} />
          <input css={inputStyle} type="range" min={0} max={0.01} step={0.0005} value={this.state.fallProb} onChange={ev => this.setState({ fallProb: ev.target.value }) } />
          <input css={inputStyle} type="range" min={0} max={0.05} step={0.001} value={this.state.mutationProb} onChange={ev => this.setState({ mutationProb: ev.target.value })} /> 
          <input css={inputStyle} type="range" min={20} max={200} value={this.state.refreshRate} onChange={ev => this.setState({ refreshRate: ev.target.value })} />
          <input css={inputStyle} type="range" min={20} max={72} value={this.state.emojiSize} onChange={ev => this.setState({ emojiSize: ev.target.value })} />
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
