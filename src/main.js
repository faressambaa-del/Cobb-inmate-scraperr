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

        // WAIT FOR RESULTS TABLE
        await page.waitForSelector('table', { timeout: 15000 });

        console.log('Search page loaded');

        // Debug: print page content length
        const html = await page.content();
        console.log('HTML length:', html.length);

        const bookingLinks = await page.$$eval('a', links =>
            links
                .map(a => a.getAttribute('href'))
                .filter(href => href && href.includes('InmDetails.asp'))
        );

        console.log(`Found ${bookingLinks.length} booking links`);

        for (const href of bookingLinks) {

            const fullUrl = `http://inmate-search.cobbsheriff.org/${href}`;

            console.log('Opening detail page:', fullUrl);

            await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

            await page.waitForSelector('table', { timeout: 10000 });

            const data = await page.evaluate(() => {

                const getValue = (label) => {
                    const cells = Array.from(document.querySelectorAll('td'));
                    const match = cells.find(td =>
                        td.innerText.trim().toLowerCase() === label.toLowerCase()
                    );
                    return match ? match.nextElementSibling?.innerText.trim() : '';
                };

                return {
                    name: getValue('Name'),
                    dob: getValue('DOB'),
                    raceSex: getValue('Race/Sex'),
                    location: getValue('Location'),
                    soid: getValue('SOID'),
                    daysInCustody: getValue('Days in Custody'),
                };
            });

            await Actor.pushData({
                ...data,
                detailUrl: fullUrl,
            });
        }
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
