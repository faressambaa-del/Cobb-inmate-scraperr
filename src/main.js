import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();

const {
    searchName = 'RANKIN SHAWN',
    searchType = 'In Custody',
} = input || {};

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(searchName)}&serial=&qry=${encodeURIComponent(searchType)}`;

const crawler = new PlaywrightCrawler({
    headless: true,

    async requestHandler({ page }) {

        console.log('Opening search page');
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('table');

        // =============================
        // EXTRACT INMATE SUMMARY
        // =============================

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

        // =============================
        // LOOP EACH INMATE
        // =============================

        for (const inmate of inmates) {

            console.log('Fetching booking for SOID:', inmate.soid);

            const response = await page.request.post(
                'http://inmate-search.cobbsheriff.org/InmDetails.asp',
                {
                    form: { soid: inmate.soid },
                }
            );

            const html = await response.text();

            // =============================
            // PARSE BOOKING PAGE
            // =============================

            const detailData = await page.evaluate((html) => {

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const result = {};

                const tables = Array.from(doc.querySelectorAll('table'));

                // =============================
                // BOOKING INFORMATION
                // =============================

                const bookingTable = tables.find(t =>
                    t.innerText.includes('Booking Information')
                );

                if (bookingTable) {
                    const rows = bookingTable.querySelectorAll('tr');
                    const values = rows[1]?.querySelectorAll('td');

                    result.agencyId = values?.[0]?.innerText.trim();
                    result.arrestDateTime = values?.[1]?.innerText.trim();
                    result.bookingStarted = values?.[2]?.innerText.trim();
                    result.bookingComplete = values?.[3]?.innerText.trim();
                }

                // =============================
                // PERSONAL INFORMATION
                // =============================

                const personalTable = tables.find(t =>
                    t.innerText.includes('Personal Information')
                );

                if (personalTable) {
                    const rows = personalTable.querySelectorAll('tr');

                    const mainRow = rows[1]?.querySelectorAll('td');
                    result.fullName = mainRow?.[0]?.innerText.trim();
                    result.dob = mainRow?.[1]?.innerText.trim();
                    result.raceSex = mainRow?.[2]?.innerText.trim();
                    result.location = mainRow?.[3]?.innerText.trim();
                    result.soid = mainRow?.[4]?.innerText.trim();
                    result.daysInCustody = mainRow?.[5]?.innerText.trim();

                    const bodyRow = rows[3]?.querySelectorAll('td');
                    result.height = bodyRow?.[0]?.innerText.trim();
                    result.weight = bodyRow?.[1]?.innerText.trim();
                    result.hair = bodyRow?.[2]?.innerText.trim();
                    result.eyes = bodyRow?.[3]?.innerText.trim();

                    const addressRow = rows[5]?.querySelectorAll('td');
                    result.address = addressRow?.[0]?.innerText.trim();
                    result.city = addressRow?.[1]?.innerText.trim();
                    result.state = addressRow?.[2]?.innerText.trim();
                    result.zip = addressRow?.[3]?.innerText.trim();

                    const pobRow = rows[7]?.querySelectorAll('td');
                    result.placeOfBirth = pobRow?.[1]?.innerText.trim();

                    const scarsRow = rows[9]?.querySelectorAll('td');
                    result.visibleScars = scarsRow?.[0]?.innerText.trim();
                }

                // =============================
                // CHARGES / BOND TABLE
                // =============================

                const chargesTable = tables.find(t =>
                    t.innerText.includes('Charge Description')
                );

                const charges = [];

                if (chargesTable) {

                    const headers = Array.from(
                        chargesTable.querySelectorAll('th')
                    ).map(h => h.innerText.trim());

                    const rows = Array.from(
                        chargesTable.querySelectorAll('tr')
                    ).slice(1);

                    rows.forEach(row => {

                        const cells = Array.from(
                            row.querySelectorAll('td')
                        ).map(td => td.innerText.trim());

                        if (cells.length) {

                            const chargeObj = {};

                            headers.forEach((header, index) => {
                                chargeObj[header] = cells[index] || '';
                            });

                            charges.push(chargeObj);
                        }
                    });
                }

                result.charges = charges;

                return result;

            }, html);

            // =============================
            // PUSH FINAL DATASET ENTRY
            // =============================

            await Actor.pushData({
                searchContext: {
                    searchName,
                    searchType,
                },
                inmateSummary: inmate,
                bookingDetails: detailData,
            });
        }
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
