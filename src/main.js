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

        for (const inmate of inmates) {

            console.log('Fetching booking for SOID:', inmate.soid);

            // 🔥 Direct POST request instead of clicking
            const response = await page.request.post(
                'http://inmate-search.cobbsheriff.org/InmDetails.asp',
                {
                    form: {
                        soid: inmate.soid,
                    },
                }
            );

            const html = await response.text();

            // Parse booking page
            const detailData = await page.evaluate((html) => {

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const getValue = (label) => {
                    const cells = Array.from(doc.querySelectorAll('td'));
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
            }, html);

            await Actor.pushData({
                ...inmate,
                ...detailData,
                detailFetched: true,
            });
        }
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
