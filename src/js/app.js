import 'babel-polyfill';

import '../styles/main.css';

import I from 'immutable';

import React from 'react';
import ReactDOM from 'react-dom';
import { style, merge } from 'glamor';
import { createElement } from 'glamor/react';

/* @jsx createElement */

import 'gsap';

try {
  PIXI.utils.skipHello();
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

function updateEmojis(version, container) {
  Object.keys(container.spriteMap).forEach(codepoint => {
    if (!version.textures[codepoint]) {
      container.removeChild(container.spriteMap[codepoint]);
      delete container.spriteMap[codepoint];
    }
  });
  const latestVersion = versions[versions.length - 1];
  let emojiCount = 0;
  emojis.forEach((emoji) => {
    if (version.textures[emoji.codepoint]) {
      let sprite;
      if (!container.spriteMap[emoji.codepoint]) {
        sprite = new PIXI.Sprite(version.textures[emoji.codepoint]);
        container.addChild(sprite);
        container.spriteMap[emoji.codepoint] = sprite;
        sprite.width = spriteSize;
        sprite.height = spriteSize;
        sprite.position.x = Math.floor(emojiCount / 20) * spriteSize;
        sprite.position.y = (emojiCount % 20) * spriteSize;
        sprite.alternates = {};
      } else {
        sprite = container.spriteMap[emoji.codepoint];
        sprite.texture = version.textures[emoji.codepoint];
        TweenMax.to(sprite.position, 10, {
          x: Math.floor(emojiCount / 20) * spriteSize,
          y: (emojiCount % 20) * spriteSize,
        });
      }
    }
    if (latestVersion.textures[emoji.codepoint]) {
      emojiCount += 1;
    }
  });
  for (let i = 0; i < emojis.length; i++) {
    const emoji = emojis[i];
  }
}

const spriteSize = 48;
class EmojiChangelogCanvas extends React.PureComponent {
  state = {
    left: 0,
    lastX: null,
  }

  animate = (currentTime) => {
    requestAnimationFrame(this.animate);
    const renderer = this._renderer;
    const stage = this._stage;
    renderer.render(stage);
  }

  handleWheel = (ev) => {
    ev.preventDefault();
    this.setState({
      left: Math.max(0, this.state.left + ev.deltaX + ev.deltaY),
    });
  }

  handleDown = (ev) => {
    ev.preventDefault();
    window.addEventListener('mousemove', this.handleMove) 
    window.addEventListener('mouseup', this.handleUp);
    window.addEventListener('touchmove', this.handleMove) 
    window.addEventListener('touchend', this.handleUp);
    window.addEventListener('touchcancel', this.handleUp);

    this.setState({
      lastX: ev.screenX || ev.touches[0].screenX,
    });
  };

  handleMove = (ev) => {
    ev.preventDefault();
    const nextX = ev.screenX || ev.touches[0].screenX;
    const deltaX = this.state.lastX - nextX; 
    this.setState({
      lastX: nextX,
      left: Math.max(0, this.state.left + deltaX),
    });
  };

  handleUp = (ev) => {
    ev.preventDefault();
    window.removeEventListener('mousemove', this.handleMove) 
    window.removeEventListener('mouseup', this.handleUp);
    window.removeEventListener('touchmove', this.handleMove) 
    window.removeEventListener('touchend', this.handleUp);
    window.removeEventListener('touchcancel', this.handleUp);
  }

  componentDidMount() {
    const el = ReactDOM.findDOMNode(this);

    const renderer = this._renderer = PIXI.autoDetectRenderer(this.props.width, this.props.height, {
      transparent: true,
      view: el,
    });

    const stage = this._stage = new PIXI.Container();

    const version = versions.find(version1 => version1.version === this.props.version);

    const emojiContainer = this._emojiContainer = new PIXI.Container();
    emojiContainer.spriteMap = {};
    updateEmojis(version, emojiContainer);

    stage.addChild(emojiContainer);

    requestAnimationFrame(this.animate);
  }

  componentDidUpdate(prevProps) {
    const stage = this._stage;
    const renderer = this._renderer;
 
    if (prevProps.width !== this.props.width || prevProps.height !== this.props.height) {
      this._renderer.resize(this.props.width, this.props.height);
    }

    const version = versions.find(version1 => version1.version === this.props.version);
    const emojiContainer = this._emojiContainer;
    updateEmojis(version, emojiContainer);
    emojiContainer.position.x = - this.state.left;
  }

  render() {
    return (
      <canvas
        style={{
          backgroundColor: '#ddd',
        }}
        width={this.props.width} height={this.props.height}
        onWheel={this.handleWheel}
        onTouchStart={this.handleDown}
        onMouseDown={this.handleDown}
        />
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
