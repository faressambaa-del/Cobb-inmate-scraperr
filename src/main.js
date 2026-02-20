import { Actor } from 'apify';
import { PlaywrightCrawler, sleep } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();

if (!input?.searchName) {
    throw new Error('Missing required input: "searchName". Format: "Last First" e.g. "Smith John"');
}

const { searchName, searchType = 'inCustody', maxResults = 10 } = input;

console.log(`🔍 Searching for: "${searchName}" | Type: ${searchType} | Max: ${maxResults}`);

const BASE_URL = 'http://inmate-search.cobbsheriff.org/enter_name.shtm';
const results = [];

const crawler = new PlaywrightCrawler({
    headless: true,
    launchContext: {
        launchOptions: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        },
    },
    requestHandlerTimeoutSecs: 120,

    async requestHandler({ page, log }) {
        log.info(`Navigating to ${BASE_URL}`);
        await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });

        const nameInput = await page.locator('input[name="name"], input[type="text"]').first();
        await nameInput.fill(searchName);
        log.info(`Filled name: "${searchName}"`);

        if (searchType === 'inCustody') {
            await page.locator('input[value*="Custody"], input[value*="custody"]').first().click();
        } else {
            await page.locator('input[value*="Inquiry"], input[value*="inquiry"]').first().click();
        }

        log.info('Submitted search, waiting for results...');
        await page.waitForLoadState('networkidle', { timeout: 90000 });
        await sleep(2000);

        const pageContent = await page.content();
        if (pageContent.toLowerCase().includes('no records found')) {
            log.info('No records found for this search.');
            return;
        }

        // Check if we landed directly on a detail page
        const isDetailPage = pageContent.includes('Booking Date') && pageContent.includes('Charge');
        if (isDetailPage) {
            log.info('Single result — on detail page directly');
            const detail = await scrapeDetailPage(page, log);
            if (detail) results.push(detail);
            return;
        }

        // Multiple results — find rows and click Latest Booking for each
        const rows = await page.locator('table tr').all();
        log.info(`Found ${rows.length} table rows`);

        const limit = Math.min(rows.length - 1, maxResults);

        for (let i = 0; i < limit; i++) {
            try {
                const currentRows = await page.locator('table tr').all();
                const targetRow = currentRows[i + 1]; // skip header
                if (!targetRow) break;

                const links = await targetRow.locator('a').all();
                let clicked = false;

                for (const link of links) {
                    const text = (await link.innerText()).toLowerCase();
                    const href = (await link.getAttribute('href')) || '';
                    if (text.includes('latest') || text.includes('booking') || href.includes('booking')) {
                        await link.click();
                        clicked = true;
                        break;
                    }
                }

                if (!clicked && links.length > 0) {
                    await links[0].click();
                    clicked = true;
                }

                if (!clicked) continue;

                await page.waitForLoadState('networkidle', { timeout: 30000 });
                await sleep(1000);

                const detail = await scrapeDetailPage(page, log);
                if (detail) {
                    results.push(detail);
                    log.info(`✅ Scraped: ${detail.name || 'Unknown'}`);
                }

                await page.goBack({ waitUntil: 'networkidle', timeout: 30000 });
                await sleep(1000);

            } catch (err) {
                log.error(`Error on row ${i + 1}: ${err.message}`);
            }
        }
    },
});

await crawler.run([{ url: BASE_URL }]);

console.log(`\n✅ Done. Total records: ${results.length}`);
if (results.length > 0) await Actor.pushData(results);

await Actor.exit();

async function scrapeDetailPage(page, log) {
    try {
        const data = { url: page.url(), scrapedAt: new Date().toISOString() };

        const rows = await page.locator('table tr').all();
        for (const row of rows) {
            const cells = await row.locator('td, th').all();
            const texts = await Promise.all(cells.map(c => c.innerText()));
            const cleaned = texts.map(t => t.trim().replace(/\s+/g, ' '));

            if (cleaned.length === 2 && cleaned[0] && cleaned[1]) {
                const key = cleaned[0].replace(/:$/, '').trim().toLowerCase().replace(/\s+/g, '_');
                data[key] = cleaned[1];
            }
        }

        // Scrape charges table
        const tables = await page.locator('table').all();
        const charges = [];
        for (const table of tables) {
            const tableText = await table.innerText();
            if (tableText.toLowerCase().includes('charge') || tableText.toLowerCase().includes('statute')) {
                const tRows = await table.locator('tr').all();
                let headers = [];
                for (let i = 0; i < tRows.length; i++) {
                    const cells = await tRows[i].locator('td, th').all();
                    const vals = await Promise.all(cells.map(c => c.innerText().then(t => t.trim())));
                    if (i === 0) { headers = vals; }
                    else if (vals.some(v => v.length > 0)) {
                        const charge = {};
                        headers.forEach((h, idx) => { charge[h || `field_${idx}`] = vals[idx] || ''; });
                        charges.push(charge);
                    }
                }
            }
        }
        if (charges.length > 0) data.charges = charges;

        return data;
    } catch (err) {
        log.error(`Failed scraping detail page: ${err.message}`);
        return null;
    }
}
