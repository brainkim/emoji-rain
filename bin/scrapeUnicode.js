import fs from 'fs';
import path from 'path';
import http from 'http';
import twemoji from 'twemoji';
import mkdirp from 'mkdirp';

import cheerio from 'cheerio';
import sharp from 'sharp';

let data = '';
const req = http.request({
  hostname: 'unicode.org',
  path: '/emoji/charts-beta/full-emoji-list.html',
  method: 'GET',
}, (res) => {
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('full-emoji-list.html', data);
    data = parseData();
    fs.writeFileSync('emojis/emojis.json', JSON.stringify(data, null, 2));
  });
});

req.end();

// let data = fs.readFileSync('full-emoji-list.html', 'utf8');
// data = parseData();
// fs.writeFileSync('emojis/emojis.json', JSON.stringify(data, null, 2));

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

function parseData() {
  const $ = cheerio.load(data);
  return $('table tr').filter((i, el) => {
    return $(el).children().first().get(0).tagName !== 'th';
  }).map((i, el) => {
    const codepoint = $(el).find('td').eq(1).find('a').text().toLowerCase().replace(/\s+/g, '-').replace(/U\+/gi, '');
    console.log(codepoint);
    const text = $(el).find('.chars').first().text();
    const name = $(el).find('.name').first().text();

    // const appleImg = $(el).find('td').eq(4).find('img');
    // const appleSrc = $(appleImg).attr('src');
    // if (appleSrc != null) {
    //   saveImage(codePoint, 'apple', appleSrc);
    // }

    // const googleImg = $(el).find('td').eq(5).find('img');
    // const googleSrc = $(googleImg).attr('src');
    // if (googleSrc != null) {
    //   saveImage(codePoint, 'google', googleSrc);
    // }

    // const twitterImg = $(el).find('td').eq(6).find('img');
    // const twitterSrc = $(twitterImg).attr('src');
    // if (twitterSrc != null) {
    //   saveImage(codePoint, 'twitter', twitterSrc);
    // }

    // const oneImg = $(el).find('td').eq(7).find('img');
    // const oneSrc = $(oneImg).attr('src');
    // if (oneSrc != null) {
    //   saveImage(codePoint, 'emojione', oneSrc);
    // }

    // const facebookImg = $(el).find('td').eq(8).find('img');
    // const facebookSrc = $(facebookImg).attr('src');
    // if (facebookSrc != null) {
    //   saveImage(codePoint, 'facebook', facebookSrc);
    // }

    return {
      codepoint,
      text,
      name,
    };
  }).toArray();
}
