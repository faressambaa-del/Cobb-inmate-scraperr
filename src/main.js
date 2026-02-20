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

        console.log('Opening search page...');
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('table');

        // ================================
        // Extract inmate row correctly
        // ================================

        const row = await page.$('table tr:nth-child(2)');
        const cells = await row.$$('td');

        const name = (await cells[1].innerText()).trim();
        const dob = (await cells[2].innerText()).trim();
        const race = (await cells[3].innerText()).trim();
        const sex = (await cells[4].innerText()).trim();
        const location = (await cells[5].innerText()).trim();
        const soid = (await cells[6].innerText()).trim();
        const daysInCustody = (await cells[7].innerText()).trim();

        console.log('SOID:', soid);

        // ================================
        // Click Last Known Booking button
        // ================================

        await page.click('input[value="Last Known Booking"]');

        // Wait for booking page to load
        await page.waitForSelector('text=Booking Information');

        console.log('Booking page loaded');

        // ================================
        // Extract ALL booking data
        // ================================

        const bookingData = await page.evaluate(() => {

            const clean = (val) => val ? val.trim() : '';

            const getCellValue = (labelText) => {
                const cells = Array.from(document.querySelectorAll('td'));
                for (let i = 0; i < cells.length; i++) {
                    if (cells[i].innerText.includes(labelText)) {
                        return clean(cells[i + 1]?.innerText);
                    }
                }
                return '';
            };

            // Booking info
            const agencyId = getCellValue('Agency ID');
            const arrestDateTime = getCellValue('Arrest Date/Time');
            const bookingStarted = getCellValue('Booking Started');
            const bookingComplete = getCellValue('Booking Complete');

            // Charges table extraction
            const charges = [];
            const tables = Array.from(document.querySelectorAll('table'));

            tables.forEach(table => {

                if (table.innerText.includes('Charge Description')) {

                    const rows = Array.from(table.querySelectorAll('tr'));
                    const headers = Array.from(rows[0].querySelectorAll('td, th'))
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

            // Bonding company
            const bondingCompany = getCellValue('Bonding Company');

            // Attorney
            const attorney = getCellValue('Attorney');

            return {
                agencyId,
                arrestDateTime,
                bookingStarted,
                bookingComplete,
                bondingCompany,
                attorney,
                charges
            };
        });

        await Actor.pushData({
            inmateSummary: {
                name,
                dob,
                race,
                sex,
                location,
                soid,
                daysInCustody
            },
            bookingDetails: bookingData
        });

        console.log('Data pushed successfully.');
    },
});

await crawler.run([{ url: searchUrl }]);
await Actor.exit();
