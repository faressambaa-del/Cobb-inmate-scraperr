import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();

const {
    searchName = 'john',
    searchType = 'In Custody',
} = input || {};

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(searchName)}&serial=&qry=${encodeURIComponent(searchType)}`;

const crawler = new PlaywrightCrawler({
    headless: true,

    async requestHandler({ page }) {

        console.log('Opening search page');
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('table');

        console.log('Search page loaded');

        // DEBUG: extract raw HTML of each result row
        const rows = await page.$$eval('table tr', trs =>
            trs.slice(1).map(tr => ({
                rawHtml: tr.innerHTML
            }))
        );

        console.log('Rows found:', rows.length);

        console.log('RAW ROW HTML BELOW:');
        console.log(JSON.stringify(rows, null, 2));

    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
