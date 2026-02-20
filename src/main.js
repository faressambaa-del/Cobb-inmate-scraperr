import { Actor } from 'apify';
import got from 'got';
import * as cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';

await Actor.init();

const proxyConfiguration = await Actor.createProxyConfiguration({
  useApifyProxy: true,
  groups: ['RESIDENTIAL'],
});

const proxyUrl = await proxyConfiguration.newUrl();

const agent = {
  http: new (require('http-proxy-agent'))(proxyUrl),
  https: new (require('https-proxy-agent'))(proxyUrl),
};

const cookieJar = new CookieJar();

const client = got.extend({
  cookieJar,
  agent,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  },
});
