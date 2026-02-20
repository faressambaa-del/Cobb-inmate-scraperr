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

        // Extract inmate list
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

            // Direct POST request to booking page
            const response = await page.request.post(
                'http://inmate-search.cobbsheriff.org/InmDetails.asp',
                {
                    form: {
                        soid: inmate.soid,
                    },
                }
            );

            const html = await response.text();

            // 🔥 Parse entire booking page dynamically
            const detailData = await page.evaluate((html) => {

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const result = {};

                const tables = doc.querySelectorAll('table');

                tables.forEach(table => {

                    const rows = Array.from(table.querySelectorAll('tr'));

                    rows.forEach(row => {

                        const headers = Array.from(row.querySelectorAll('th')).map(h =>
                            h.innerText.trim()
                        );

                        const cells = Array.from(row.querySelectorAll('td')).map(td =>
                            td.innerText.trim()
                        );

                        // Header + Value rows
                        if (headers.length && cells.length) {
                            headers.forEach((header, i) => {
                                if (cells[i]) {
                                    result[header] = cells[i];
                                }
                            });
                        }

                        // Label / Value pair rows
                        if (cells.length === 2) {
                            const key = cells[0];
                            const value = cells[1];
                            if (key && value && key.length < 50) {
                                result[key] = value;
                            }
                        }

                    });
                });

                // Capture Charges table specifically
                const chargeSection = [];

                tables.forEach(table => {

                    const headers = Array.from(table.querySelectorAll('th')).map(h =>
                        h.innerText.trim()
                    );

                    if (headers.includes('Charge Description')) {

                        const rows = Array.from(table.querySelectorAll('tr')).slice(1);

                        rows.forEach(row => {

                            const cells = Array.from(row.querySelectorAll('td')).map(td =>
                                td.innerText.trim()
                            );

                            const chargeObj = {};

                            headers.forEach((h, i) => {
                                chargeObj[h] = cells[i] || '';
                            });

                            chargeSection.push(chargeObj);
                        });
                    }
                });

                if (chargeSection.length) {
                    result['Charges'] = chargeSection;
                }

                return result;

            }, html);

            await Actor.pushData({
                searchContext: {
                    searchName,
                    searchType
                },
                inmateSummary: inmate,
                bookingDetails: detailData,
            });
        }
    },
});

await crawler.run([{ url: searchUrl }]);

await Actor.exit();
