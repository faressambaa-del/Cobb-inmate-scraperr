import { Actor } from 'apify';
import got from 'got';
import * as cheerio from 'cheerio';

await Actor.init();

// ---- INPUT ----
// You can later replace this with Actor.getInput()
const inmateName = 'Rankin Shawn';

const searchUrl =
  `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(inmateName)}&serial=&qry=In+Custody`;

// ---- HEADERS (important for gov sites) ----
const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
};

// ---- STEP 1: FETCH SEARCH PAGE ----
const searchResponse = await got(searchUrl, { headers });

const $search = cheerio.load(searchResponse.body);

// Find first details link
const detailsRelativeUrl = $search('a[href*="InmDetails.asp"]').first().attr('href');

if (!detailsRelativeUrl) {
  console.log('No inmate found.');
  await Actor.exit();
}

const detailsUrl = new URL(detailsRelativeUrl, searchUrl).href;

// ---- STEP 2: FETCH DETAILS PAGE ----
const detailsResponse = await got(detailsUrl, { headers });
const $ = cheerio.load(detailsResponse.body);

// ---- STEP 3: EXTRACT DATA PROPERLY ----

const result = {};

// Extract all tables
$('table').each((_, table) => {
  const rows = $(table).find('tr');

  rows.each((_, row) => {
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
});

// ---- CLEAN OUTPUT ----
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
