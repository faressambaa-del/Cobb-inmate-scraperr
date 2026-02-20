import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const {
    searchName = 'john',
    searchType = 'In Custody',
    maxResults = 10
} = input || {};

console.log(`Searching for: "${searchName}" | Type: ${searchType}`);

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(searchName)}&serial=&qry=${encodeURIComponent(searchType)}`;

console.log(`Search URL: ${searchUrl}`);

const results = [];

const crawler = new CheerioCrawler({
    async requestHandler({ $, request }) {
        console.log(`Processing ${request.url}`);

        console.log("Page title:", $('title').text());
        console.log("Total tables found:", $('table').length);

        // Debug each table
        $('table').each((i, table) => {
            const rowCount = $(table).find('tr').length;
            console.log(`Table ${i} has ${rowCount} rows`);
        });

        // Temporary: Try extracting all rows from all tables
        $('table tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length > 3) {
                const record = {
                    col1: $(cells[0]).text().trim(),
                    col2: $(cells[1]).text().trim(),
                    col3: $(cells[2]).text().trim(),
                    col4: $(cells[3]).text().trim(),
                };

                if (record.col1) {
                    results.push(record);
                }
            }
        });
    }
});

await crawler.run([searchUrl]);

console.log(`Total extracted rows: ${results.length}`);

await Actor.pushData(results.slice(0, maxResults));

await Actor.exit();
