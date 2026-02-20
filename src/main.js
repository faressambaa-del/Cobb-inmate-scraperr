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

        // Extract inmate basic data
        const inmates = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tr')).slice(1);

            return rows.map(row => {
                const cells = row.querySelectorAll('td');

                return {
                    name: cells[1]?.innerText.trim(),
                    dob: cells[2]?.innerText.trim(),
                    race: cells[3]?.innerText.trim(),
                    sex: cells[4]?.innerText.trim(),
                    location: cells[5]?.innerText.trim(),
                    soid: cells[6]?.innerText.trim(),
                    daysInCustody: cells[7]?.innerText.trim(),
                };
            }).filter(r => r.soid);
        });

        console.log('Found inmates:', inmates.length);

        // Extract booking URLs from page inputs
        const bookingButtons = await page.$$eval('input', inputs =>
            inputs
                .map(i => i.getAttribute('onclick'))
                .filter(o => o && o.includes('InmDetails.asp'))
        );

        console.log('Booking buttons found:', bookingButtons.length);

        for (const inmate of inmates) {

            // Find matching booking button by SOID
            const match = bookingButtons.find(b => b.includes(inmate.soid));

            if (!match) continue;

            const urlMatch = match.match(/InmDetails\.asp[^']+/);

            if (!urlMatch) continue;

            const fullDetailUrl =
                `http://inmate-search.cobbsheriff.org/${urlMatch[0]}`;

            console.log('Opening detail page:', fullDetailUrl);

            await page.goto(fullDetailUrl, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('table');

            const detailData = await page.evaluate(() => {

                const getValue = (label) => {
                    const cells = Array.from(document.querySelectorAll('td'));
                    const match = cells.find(td =>
                        td.innerText.trim().toLowerCase() === label.toLowerCase()
                    );
                    return match ? match.nextElementSibling?.innerText.trim() : '';
                };

                return {
                    agencyId: getValue('Agency ID'),
                    arrestDateTime: getValue('Arrest Date/Time'),
                    bookingStarted: getValue('Booking Started'),
                    bookingComplete: getValue('Booking Complete'),
                    height: getValue('Height'),
                    weight: getValue('Weight'),
                    hair: getValue('Hair'),
                    eyes: getValue('Eyes'),
                    address: getValue('Address'),
                    city: getValue('City'),
                    state: getValue('State'),
                    zip: getValue('Zip'),
                    placeOfBirth: getValue('Place of Birth'),
                    visibleScars: getValue('Visible Scars and Marks'),
                };
            });

            await Actor.pushData({
                ...inmate,
                ...detailData,
                detailUrl: fullDetailUrl,
            });
        }
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
