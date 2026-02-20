import { Actor } from 'apify';
import { CheerioCrawler, RequestQueue } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();

const {
    searchName = 'john',
    searchType = 'In Custody',
} = input || {};

const searchUrl = `http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=${encodeURIComponent(searchName)}&serial=&qry=${encodeURIComponent(searchType)}`;

const requestQueue = await RequestQueue.open();

await requestQueue.addRequest({
    url: searchUrl,
    label: 'LIST',
});

const crawler = new CheerioCrawler({
    requestQueue,
    useSessionPool: true,
    persistCookiesPerSession: true,

    async requestHandler({ $, request, body }) {

        if (request.label === 'LIST') {

            console.log("=== RAW HTML LENGTH ===");
            console.log(body.length);

            console.log("=== FIRST 1000 CHARS ===");
            console.log(body.substring(0, 1000));

            const allLinks = $('a');
            console.log("Total <a> tags found:", allLinks.length);

            allLinks.each((i, el) => {
                const href = $(el).attr('href');
                if (href) {
                    console.log("Link:", href);
                }
            });
        }
    },
});

await crawler.run();
await Actor.exit();
