import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const { name = 'john', maxResults = 10 } = input || {};

console.log(`Searching for: "${name}"`);

const results = [];

const crawler = new CheerioCrawler({
    async requestHandler({ $, request }) {
        console.log(`Processing ${request.url}`);

        // Example: adjust selectors based on actual page structure
        $('table tr').each((i, el) => {
            if (i === 0) return; // skip header

            const row = $(el).find('td');
            const record = {
                fullName: $(row[0]).text().trim(),
                bookingNumber: $(row[1]).text().trim(),
                status: $(row[2]).text().trim(),
            };

            if (record.fullName) {
                results.push(record);
            }
        });
    }
});

await crawler.run([
    'http://inmate-search.cobbsheriff.org/enter_name.htm'
]);

await Actor.pushData(results.slice(0, maxResults));

await Actor.exit();
