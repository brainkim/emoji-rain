import fs from 'fs';
import path from 'path';
import http from 'http';
import twemoji from 'twemoji';
import mkdirp from 'mkdirp';

import cheerio from 'cheerio';
import sharp from 'sharp';
import async from 'async';

const version = 'ios-10.0';
mkdirp(`./emojis/apple/${version}/`);
let data = '';
http.request({
  hostname: 'emojipedia.org',
  path: `/apple/${version}/`,
  method: 'GET',
}, (res) => {
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('poop.html', data);
    const emojis = parseHtml(data);
    async.mapLimit(emojis, 10, fetchEmojiFromDetailPage, (err, emojis) => {
    });
  });
}).end();

function parseHtml(html) {
  const $ = cheerio.load(html);
  return $('.emoji-grid a').map((i, a) => {
    const img = $(a).find('>img');
    const name = $(img).attr('alt');
    const imageUrl = $(img).data('src') || $(img).attr('src');
    const detailUrl = $(a).attr('href');
    return {
      name,
      imageUrl,
      detailUrl,
    };
  });
}

function parseDetailPage(html) {
  const $ = cheerio.load(html);
  return $('h1 > .emoji').first().text();
}

function fetchEmojiFromDetailPage(data, callback) {
  http.request({
    hostname: 'emojipedia.org', 
    path: data.detailUrl,
    method: 'GET',
  }, (res) => {
    let detailPage = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      detailPage += chunk;
    });
    res.on('end', () => {
      const emoji = parseDetailPage(detailPage);
      downloadImage({...data, emoji}, callback);
    });
  }).end();
}

function downloadImage(data, callback) {
  const codePoint = twemoji.convert.toCodePoint(data.emoji);
  const out = fs.createWriteStream(`emojis/apple/${version}/${codePoint}.png`);
  http.get(data.imageUrl, (res) => {
    console.log(data.emoji, codePoint, res.statusCode);
    if (res.statusCode === 200) {
      res.pipe(out);
      callback(null, data.emoji);
    } else {
      callback(res);
    }
  });
}
