import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const {
    name = 'john',
    status = 'In Custody',
    maxResults = 10
} = input || {};

console.log(`Searching for: "${name}" | Status: ${status}`);

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(name)}&serial=&qry=${encodeURIComponent(status)}`;

console.log(`Search URL: ${searchUrl}`);

const results = [];

const crawler = new CheerioCrawler({
    async requestHandler({ $, request }) {
        console.log(`Processing ${request.url}`);

        $('table tr').each((i, el) => {
            if (i === 0) return;

            const cells = $(el).find('td');

            const record = {
                fullName: $(cells[0]).text().trim(),
                bookingNumber: $(cells[1]).text().trim(),
                sex: $(cells[2]).text().trim(),
                race: $(cells[3]).text().trim(),
                age: $(cells[4]).text().trim(),
                status: $(cells[5]).text().trim(),
            };

            if (record.fullName) {
                results.push(record);
            }
        });
    }
});

await crawler.run([searchUrl]);

await Actor.pushData(results.slice(0, maxResults));

await Actor.exit();
