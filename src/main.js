import { Actor } from 'apify';
import got from 'got';
import * as cheerio from 'cheerio';

await Actor.init();

const url =
  'http://inmate-search.cobbsheriff.org/InmDetails.asp?soid=001115049&BOOKING_ID=22553403705379';

const response = await got(url, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
  },
});

const $ = cheerio.load(response.body);

const extractValue = (label) => {
  const cell = $('td')
    .filter((_, el) => $(el).text().trim() === label)
    .first();

  return cell.next('td').text().trim() || null;
};

const data = {
  name: extractValue('Name'),
  dob: extractValue('DOB'),
  raceSex: extractValue('Race/Sex'),
  location: extractValue('Location'),
  soid: extractValue('SOID'),
  daysInCustody: extractValue('Days in Custody'),
  height: extractValue('Height'),
  weight: extractValue('Weight'),
  hair: extractValue('Hair'),
  eyes: extractValue('Eyes'),
};

console.log(data);

await Actor.pushData(data);
await Actor.exit();
