import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const crawler = new PlaywrightCrawler({

    async requestHandler({ request, page, log }) {

        log.info(`Processing: ${request.url}`);

        await page.waitForSelector('table', { timeout: 60000 });

        const bookingLink = await page
            .locator('a:has-text("Last Known Booking")')
            .first()
            .getAttribute('href');

        if (!bookingLink) {
            log.warning('No booking link found.');
            return;
        }

        const fullUrl = new URL(bookingLink, page.url()).href;

        await page.goto(fullUrl, { waitUntil: 'networkidle' });

        await page.waitForSelector('text=Booking Information', { timeout: 60000 });

        const data = await page.evaluate(() => {
            const extractRowValue = (label) => {
                const cells = Array.from(document.querySelectorAll('td'));
                for (let i = 0; i < cells.length; i++) {
                    if (cells[i].innerText.trim() === label) {
                        return cells[i + 1]?.innerText.trim() || null;
                    }
                }
                return null;
            };

            return {
                name: extractRowValue('Name'),
                dob: extractRowValue('DOB'),
                raceSex: extractRowValue('Race/Sex'),
                location: extractRowValue('Location'),
                soid: extractRowValue('SOID'),
                daysInCustody: extractRowValue('Days in Custody'),
                height: extractRowValue('Height'),
                weight: extractRowValue('Weight'),
                hair: extractRowValue('Hair'),
                eyes: extractRowValue('Eyes'),
            };
        });

        await Actor.pushData(data);
    },
});

await crawler.run([
    'http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=Rankin+Shawn&serial=&qry=In+Custody'
]);

await Actor.exit();
