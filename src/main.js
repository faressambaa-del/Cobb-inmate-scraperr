import { Actor } from 'apify';
import got from 'got';
import * as cheerio from 'cheerio';
import { CookieJar } from 'tough-cookie';

await Actor.init();

const inmateName = 'Rankin Shawn';

const baseUrl = 'http://inmate-search.cobbsheriff.org';

const searchUrl =
  `${baseUrl}/inquiry.asp?soid=&inmate_name=${encodeURIComponent(inmateName)}&serial=&qry=In+Custody`;

// ---- Maintain Session ----
const cookieJar = new CookieJar();

const client = got.extend({
  cookieJar,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
  },
});

// ---- STEP 1: Initial Visit (important for session) ----
await client.get(baseUrl);

// ---- STEP 2: Perform Search ----
const searchResponse = await client.get(searchUrl);

const $search = cheerio.load(searchResponse.body);

// Debug: print first 500 chars if needed
// console.log(searchResponse.body.slice(0, 500));

const detailsRelativeUrl = $search('a[href*="InmDetails.asp"]').first().attr('href');

if (!detailsRelativeUrl) {
  console.log('Search page did not return inmate results.');
  await Actor.exit();
}

const detailsUrl = new URL(detailsRelativeUrl, baseUrl).href;

// ---- STEP 3: Fetch Details Page (same session) ----
const detailsResponse = await client.get(detailsUrl);
const $ = cheerio.load(detailsResponse.body);

const result = {};

// Extract all header/value pairs properly
$('tr').each((_, row) => {
  const headers = $(row).find('th');
  const values = $(row).find('td');

  if (headers.length && values.length && headers.length === values.length) {
    headers.each((i, header) => {
      const key = $(header).text().trim();
      const value = values.eq(i).text().trim();
      if (key) result[key] = value;
    });
  }
});

const cleaned = {
  agencyId: result['Agency ID'] || null,
  arrestDateTime: result['Arrest Date/Time'] || null,
  bookingStarted: result['Booking Started'] || null,
  bookingComplete: result['Booking Complete'] || null,
  name: result['Name'] || null,
  dob: result['DOB'] || null,
  raceSex: result['Race/Sex'] || null,
  location: result['Location'] || null,
  soid: result['SOID'] || null,
  daysInCustody: result['Days in Custody'] || null,
  height: result['Height'] || null,
  weight: result['Weight'] || null,
  hair: result['Hair'] || null,
  eyes: result['Eyes'] || null,
  address: result['Address'] || null,
  city: result['City'] || null,
  state: result['State'] || null,
  zip: result['Zip'] || null,
  placeOfBirth: result['Place of Birth'] || null,
};

console.log(cleaned);

await Actor.pushData(cleaned);
await Actor.exit();
