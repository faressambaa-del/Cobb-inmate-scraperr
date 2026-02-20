import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();

const {
    searchName = 'john',
    searchType = 'In Custody',
    maxResults = 10,
} = input || {};

console.log(`Searching for: ${searchName}`);

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(searchName)}&serial=&qry=${encodeURIComponent(searchType)}`;

const results = [];

const crawler = new CheerioCrawler({
    async requestHandler({ $, request }) {
        console.log(`Processing ${request.url}`);

        const tables = $('table');
        console.log(`Tables found: ${tables.length}`);

        tables.each((i, table) => {
            const rows = $(table).find('tr');

            if (rows.length > 1) {
                rows.slice(1).each((_, row) => {
                    const cells = $(row).find('td');

                    if (cells.length >= 4) {
                        const record = {
                            name: $(cells[1]).text().trim(),
                            dob: $(cells[2]).text().trim(),
                            race: $(cells[3]).text().trim(),
                        };

                        if (record.name && record.name !== 'Name') {
                            results.push(record);
                        }
                    }
                });
            }
        });

        console.log(`Extracted records: ${results.length}`);
    }
});

await crawler.run([searchUrl]);

await Actor.pushData(results.slice(0, maxResults));

await Actor.exit();
