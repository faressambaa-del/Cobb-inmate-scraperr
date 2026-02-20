import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();

const {
    searchName = 'Rankin Shawn',
    searchType = 'In Custody',
} = input || {};

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(searchName)}&serial=&qry=${encodeURIComponent(searchType)}`;

const crawler = new PlaywrightCrawler({
    headless: true,

    async requestHandler({ page }) {

        console.log('Opening search page');
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('table');

        // Extract SOID
        const soid = await page.$eval(
            'td:has-text("IN JAIL") >> xpath=../td[6]',
            el => el.innerText.trim()
        );

        console.log('SOID:', soid);

        // CLICK the red Last Known Booking button
        await Promise.all([
            page.waitForNavigation(),
            page.click('input[value="Last Known Booking"]')
        ]);

        console.log('Navigated to booking page');

        await page.waitForSelector('table');

        // ==========================
        // SCRAPE FULL BOOKING PAGE
        // ==========================

        const bookingData = await page.evaluate(() => {

            const result = {};
            const tables = Array.from(document.querySelectorAll('table'));

            // Capture ALL table data
            tables.forEach(table => {

                const rows = Array.from(table.querySelectorAll('tr'));

                rows.forEach(row => {

                    const headers = Array.from(row.querySelectorAll('th, td'))
                        .map(cell => cell.innerText.trim());

                    if (headers.length > 1) {
                        result[`row_${Math.random()}`] = headers;
                    }
                });
            });

            // Now specifically extract Charges section
            const charges = [];

            tables.forEach(table => {

                if (table.innerText.includes('Charge Description')) {

                    const rows = Array.from(table.querySelectorAll('tr'));
                    const headerRow = rows[0];
                    const headers = Array.from(headerRow.querySelectorAll('td, th'))
                        .map(h => h.innerText.trim());

                    rows.slice(1).forEach(row => {

                        const cells = Array.from(row.querySelectorAll('td'))
                            .map(c => c.innerText.trim());

                        if (!cells.length) return;

                        const obj = {};
                        headers.forEach((header, i) => {
                            obj[header] = cells[i] || '';
                        });

                        charges.push(obj);
                    });
                }
            });

            result.charges = charges;

            return result;
        });

        await Actor.pushData({
            soid,
            bookingData
        });
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
