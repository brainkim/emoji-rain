import fs from 'fs';
import path from 'path';
import http from 'http';
import twemoji from 'twemoji';
import mkdirp from 'mkdirp';

import cheerio from 'cheerio';
import sharp from 'sharp';

let data = '';
const req = http.request({
  hostname: 'emojipedia.org',
  path: '/apple/ios-5.0/',
  method: 'GET',
}, (res) => {
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('poop.html', data);
    data = parseData();
  });
});

req.end();

function saveImage(unicode, vendor, src) {
  const match = src.match(/^data:.+\/(.+);base64,(.*)$/);
  const ext = match[1];
  const data = match[2];
  const buffer = new Buffer(data, 'base64');
  [24, 48, 72].forEach((size) => {
    const path = `emojis/${vendor}/${size}x${size}/`;
    mkdirp.sync(path);
    sharp(buffer).resize(size).toFile(`${path}${unicode}.${ext}`, (err, i) => {
      console.log(err, i);
    });
  });
}

import emojis from '../emojis/emojis.json';
function parseData() {
  const $ = cheerio.load(data);
  return $('.emoji-grid a>img').each((i, el) => {
    const name = $(el).attr('title').toLowerCase();
    const src = $(el).attr('src');
    const emoji = emojis.find((e) => e.name === name);
    if (emoji == null) {
      console.log(name);
    }
  });
}
