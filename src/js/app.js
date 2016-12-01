import 'babel-polyfill';

import '../styles/main.css';

import I from 'immutable';

import React from 'react';
import ReactDOM from 'react-dom';

import PIXI from 'pixi.js';
import ReactPIXI, { Stage, Sprite, DisplayObjectContainer } from 'react-pixi';
import { style, merge } from 'glamor';
import { createElement } from 'glamor/react';

/* @jsx createElement */

import 'gsap';

try {
  PIXI.utils._saidHello = true;
} catch (err) {
  console.log('PIXI won\'t shut the fuck up because', err);
}

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update');
//   whyDidYouUpdate(React)
// }

let emojis = require('../../emojis/emojis.json');

let versions = [
  {
    version: 'ios-5.0',
    phoneVersion: 'iphone-4s',
    glue: require('../../emojis/apple/ios-5.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-5.0/64x64.png'),
  },
  {
    version: 'ios-6.0',
    phoneVersion: 'iphone-5',
    glue: require('../../emojis/apple/ios-6.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-6.0/64x64.png'),
  },
  {
    version: 'ios-8.3',
    phoneVersion: 'iphone-6',
    glue: require('../../emojis/apple/ios-8.3/64x64.json'),
    sheet: require('../../emojis/apple/ios-8.3/64x64.png'),
  },
  {
    version: 'ios-9.0',
    phoneVersion: 'iphone-6',
    glue: require('../../emojis/apple/ios-9.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-9.0/64x64.png'),
  },
  {
    version: 'ios-9.1',
    phoneVersion: 'iphone-6',
    glue: require('../../emojis/apple/ios-9.1/64x64.json'),
    sheet: require('../../emojis/apple/ios-9.1/64x64.png'),
  },
  {
    version: 'ios-9.3',
    phoneVersion: 'iphone-6',
    glue: require('../../emojis/apple/ios-9.3/64x64.json'),
    sheet: require('../../emojis/apple/ios-9.3/64x64.png'),
  },
  {
    version: 'ios-10.0',
    phoneVersion: 'iphone-7',
    glue: require('../../emojis/apple/ios-10.0/64x64.json'),
    sheet: require('../../emojis/apple/ios-10.0/64x64.png'),
  },
];

function createTextures(version) {
  const sheetTexture = PIXI.Texture.fromImage(version.sheet);
  const textures = Object.values(version.glue.frames).reduce((textures, data) => {
    const texture = new PIXI.Texture(sheetTexture, new PIXI.Rectangle(- data.frame.x, - data.frame.y, data.frame.w, data.frame.h));
    textures[data.filename.replace(/\.png$/, '')] = texture;
    return textures;
  }, {});
  return textures;
}

versions = versions.map((version) => {
  const textures = createTextures(version);
  return { ...version, textures };
});

const spriteSize = 48;

class EmojiChangelogCanvas extends React.PureComponent {
  componentDidMount() {
    console.log(this._stage);
  }
  render() {
    const version = versions[0];
    const sprites = emojis.filter(emoji => {
      return version.textures[emoji.codepoint];
    }).map((emoji, i) => {
      const texture = version.textures[emoji.codepoint];
      const x = Math.floor(i / 10) * spriteSize;
      const y = (i % 10) * spriteSize;
      return ( 
        <Sprite
          key={emoji.codepoint}
          position={new PIXI.Point(x, y)}
          texture={texture}
          width={spriteSize}
          height={spriteSize}
          />
      );
    });
    return (
      <Stage width={this.props.width} height={this.props.height} ref={stage => this._stage = stage}>
        {sprites}
      </Stage>
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
    window.addEventListener('keydown', this.handleKeydown);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeydown);
  }

  handleResize = () => {
    this.setState({
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });
  }

  handleKeydown = (ev) => {
    if (ev.keyCode >= 49 && ev.keyCode < 49 + versions.length && !ev.altKey && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) {
      const version = versions[ev.keyCode - 49].version;
      this.setState({ version });
    }
  }

  handleVersionChange = (ev) => {
    this.setState({ version: ev.target.value });
  }

  render() {
    const { viewport } = this.state;
    return (
      <div>
        <EmojiChangelogCanvas width={viewport.width} height={viewport.height} version={this.state.version} />
        <div css={{position: 'fixed', bottom: 0, left: 0 }}>
          <select value={this.state.version} onChange={this.handleVersionChange}>
            {versions.map((version) =>
              <option key={version.version} value={version.version}>{version.version}</option>
            )}
          </select>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<EmojiChangelogApp />, document.getElementById('app'));
