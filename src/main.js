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

        const inmates = await page.$$eval('table tr', rows =>
            rows.slice(1).map(row => {
                const cells = Array.from(row.querySelectorAll('td'));

                const button = row.querySelector('input[type="button"]');
                let bookingUrl = '';

                if (button && button.getAttribute('onclick')) {
                    const match = button.getAttribute('onclick')
                        .match(/InmDetails\.asp[^']+/);
                    if (match) {
                        bookingUrl = match[0];
                    }
                }

                return {
                    name: cells[1]?.innerText.trim(),
                    dob: cells[2]?.innerText.trim(),
                    race: cells[3]?.innerText.trim(),
                    sex: cells[4]?.innerText.trim(),
                    location: cells[5]?.innerText.trim(),
                    soid: cells[6]?.innerText.trim(),
                    daysInCustody: cells[7]?.innerText.trim(),
                    bookingUrl,
                };
            })
        );

        console.log('Found inmates:', inmates.length);

        for (const inmate of inmates) {

            if (!inmate.bookingUrl) continue;

            const fullDetailUrl =
                `http://inmate-search.cobbsheriff.org/${inmate.bookingUrl}`;

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
