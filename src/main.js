import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const START_URL =
    'http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=Rankin+Shawn&serial=&qry=In+Custody';

const crawler = new PlaywrightCrawler({
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },

    browserPoolOptions: {
        useFingerprints: true,
    },

    async requestHandler({ page, request, log }) {
        log.info(`Processing: ${request.url}`);

        await page.waitForLoadState('networkidle');

        // DEBUG (optional)
        // console.log(await page.content());

        const bookingLink = await page.evaluate(() => {
            const link = document.querySelector('a[href*="InmDetails.asp"]');
            return link ? link.getAttribute('href') : null;
        });

        if (!bookingLink) {
            log.warning('No booking link found.');
            return;
        }

        const fullUrl = new URL(bookingLink, request.url).href;

        log.info(`Found booking URL: ${fullUrl}`);

        await page.goto(fullUrl, { waitUntil: 'networkidle' });

        const data = await page.evaluate(() => {
            const extractValue = (label) => {
                const cells = Array.from(document.querySelectorAll('td'));
                for (let i = 0; i < cells.length; i++) {
                    if (cells[i].innerText.trim() === label) {
                        return cells[i + 1]?.innerText.trim() || null;
                    }
                }
                return null;
            };

            return {
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
        });

        log.info('Scraped:', data);

        await Actor.pushData(data);
    },
});

await crawler.run([START_URL]);
await Actor.exit();
