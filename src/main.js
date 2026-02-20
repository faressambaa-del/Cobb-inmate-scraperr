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

        // ===============================
        // EXTRACT INMATE SUMMARY
        // ===============================
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

            const response = await page.request.post(
                'http://inmate-search.cobbsheriff.org/InmDetails.asp',
                { form: { soid: inmate.soid } }
            );

            const html = await response.text();

            // ===============================
            // PARSE BOOKING PAGE
            // ===============================
            const detailData = await page.evaluate((html) => {

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const result = {};
                const tables = Array.from(doc.querySelectorAll('table'));

                // ===============================
                // BOOKING INFORMATION
                // ===============================
                const bookingTable = tables.find(t =>
                    t.innerText.includes('Booking Information')
                );

                if (bookingTable) {
                    const rows = bookingTable.querySelectorAll('tr');
                    const values = rows[1]?.querySelectorAll('td');

                    result.booking = {
                        agencyId: values?.[0]?.innerText.trim(),
                        arrestDateTime: values?.[1]?.innerText.trim(),
                        bookingStarted: values?.[2]?.innerText.trim(),
                        bookingComplete: values?.[3]?.innerText.trim(),
                    };
                }

                // ===============================
                // PERSONAL INFORMATION
                // ===============================
                const personalTable = tables.find(t =>
                    t.innerText.includes('Personal Information')
                );

                if (personalTable) {
                    const rows = personalTable.querySelectorAll('tr');

                    const main = rows[1]?.querySelectorAll('td');
                    const body = rows[3]?.querySelectorAll('td');
                    const address = rows[5]?.querySelectorAll('td');
                    const pob = rows[7]?.querySelectorAll('td');
                    const scars = rows[9]?.querySelectorAll('td');

                    result.personal = {
                        fullName: main?.[0]?.innerText.trim(),
                        dob: main?.[1]?.innerText.trim(),
                        raceSex: main?.[2]?.innerText.trim(),
                        location: main?.[3]?.innerText.trim(),
                        soid: main?.[4]?.innerText.trim(),
                        daysInCustody: main?.[5]?.innerText.trim(),
                        height: body?.[0]?.innerText.trim(),
                        weight: body?.[1]?.innerText.trim(),
                        hair: body?.[2]?.innerText.trim(),
                        eyes: body?.[3]?.innerText.trim(),
                        address: address?.[0]?.innerText.trim(),
                        city: address?.[1]?.innerText.trim(),
                        state: address?.[2]?.innerText.trim(),
                        zip: address?.[3]?.innerText.trim(),
                        placeOfBirth: pob?.[1]?.innerText.trim(),
                        visibleScars: scars?.[0]?.innerText.trim(),
                    };
                }

                // ===============================
                // CHARGES / BOND / ATTORNEY
                // ===============================
                const charges = [];

                tables.forEach(table => {

                    const text = table.innerText;

                    if (
                        text.includes('Charge Description') ||
                        text.includes('Bond Amount') ||
                        text.includes('Bonding Company') ||
                        text.includes('Attorney')
                    ) {

                        const rows = Array.from(table.querySelectorAll('tr'));

                        if (rows.length < 2) return;

                        const headerCells = Array.from(rows[0].querySelectorAll('td, th'))
                            .map(cell => cell.innerText.trim());

                        rows.slice(1).forEach(row => {

                            const cells = Array.from(row.querySelectorAll('td'))
                                .map(cell => cell.innerText.trim());

                            if (!cells.length) return;

                            const chargeObj = {};

                            headerCells.forEach((header, index) => {
                                if (header) {
                                    chargeObj[header] = cells[index] || '';
                                }
                            });

                            charges.push(chargeObj);
                        });
                    }
                });

                result.charges = charges;

                return result;

            }, html);

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
