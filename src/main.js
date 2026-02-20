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

        // Extract rows from results table
        const rows = await page.$$eval('table tr', trs =>
            trs.slice(1).map(tr => {
                const cells = Array.from(tr.querySelectorAll('td'));
                return cells.map(td => td.innerText.trim());
            })
        );

        console.log('Rows found:', rows.length);

        for (const row of rows) {

            // Based on your screenshot structure:
            // [Image, Name, DOB, Race, Sex, Location, SOID, Days, ...]
            const name = row[1];
            const dob = row[2];
            const race = row[3];
            const sex = row[4];
            const location = row[5];
            const soid = row[6];
            const days = row[7];

            await Actor.pushData({
                name,
                dob,
                race,
                sex,
                location,
                soid,
                daysInCustody: days,
            });
        }
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
