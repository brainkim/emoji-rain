import 'babel-polyfill';

import '../styles/reset.css';

import React from 'react';
import ReactDOM from 'react-dom';

import emojis from '../../emojis/emojis.json';

class EmojiRainCanvas extends React.Component {
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

class EmojiRain extends React.Component {
  static defaultProps = {
    width: 2000,
    height: 1000,
    emojiSize: 24,
    emojis: [],
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


class EmojiSelector extends React.Component {
  static defaultProps = {
    selected: [],
    onSelect: () => {},
  }

  handleKeyPress = (ev) => {
    if (ev.which === 13) {
      this.handleClick(ev);
    }
  }

  handleClick = (ev) => {
    const selected = this.props.selected;
    const e = JSON.parse(ev.target.dataset.emoji);
    const index = selected.findIndex((e1) => {
      return e1.text === e.text;
    });
    let nextSelected;
    if (index !== -1) {
      nextSelected = selected.slice(0, index).concat(selected.slice(index + 1));
    } else {
      nextSelected = selected.concat([e]);
    }
    this.props.onSelect(nextSelected);
  }

  render() {
    return (
      <div style={{
        width: 421,
        backgroundColor: 'white',
        maxHeight: 400,
        overflowX: 'hidden',
        overflowY: 'scroll',
      }}>
        {emojis.filter((e) => e.hasApple).map((e) => {
          const src = process.publicPath + 'assets/emojis/apple/24x24/' + e.codePoint + '.png';
          return (
            <img
              key={e.text}
              src={src}
              style={{
                width: 50,
                height: 50,
                userSelect: 'none',
                opacity: this.props.selected.find(e1 => e1.text === e.text) ? 1 : 0.2,
                cursor: 'pointer',
              }}
              onClick={this.handleClick}
              onKeyPress={this.handleKeyPress}
              tabIndex="0"
              alt={e.text}
              data-emoji={JSON.stringify(e)}
              />
          );
        })}
      </div>
    );
  }
}

class App extends React.Component {
  state = {
    viewport: { width: 0, height: 0 },
    selectedEmojis: [],
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
            emojis={this.state.selectedEmojis}
            emojiSize={this.state.emojiSize}
            fallProb={this.state.fallProb}
            mutationProb={this.state.mutationProb}
            refreshRate={this.state.refreshRate}
            />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, fontSize: 30}}>
          <EmojiSelector selected={this.state.selectedEmojis} onSelect={(selected) => {
            this.setState({ selectedEmojis: selected });
          }} />
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
