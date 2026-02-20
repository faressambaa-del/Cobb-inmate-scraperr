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
    userData: { label: 'LIST' },
});

const crawler = new CheerioCrawler({
    requestQueue,
    useSessionPool: true,
    persistCookiesPerSession: true,

    async requestHandler({ $, request }) {

        const label = request.userData.label;

        // ======================
        // LIST PAGE
        // ======================
        if (label === 'LIST') {

            console.log('Processing search results page');

            const links = [];

            $('a[href*="InmDetails.asp"]').each((_, el) => {
                const href = $(el).attr('href');

                if (href) {
                    const fullUrl = `http://inmate-search.cobbsheriff.org/${href}`;
                    links.push(fullUrl);
                }
            });

            console.log(`Found ${links.length} booking links`);

            for (const url of links) {
                await requestQueue.addRequest({
                    url,
                    userData: { label: 'DETAIL' },
                });
            }
        }

        // ======================
        // DETAIL PAGE
        // ======================
        if (label === 'DETAIL') {

            console.log('Processing booking detail page:', request.url);

            const name = $('td:contains("Name")').next().text().trim();
            const dob = $('td:contains("DOB")').next().text().trim();
            const raceSex = $('td:contains("Race/Sex")').next().text().trim();
            const location = $('td:contains("Location")').next().text().trim();
            const soid = $('td:contains("SOID")').next().text().trim();
            const days = $('td:contains("Days in Custody")').next().text().trim();

            await Actor.pushData({
                name,
                dob,
                raceSex,
                location,
                soid,
                daysInCustody: days,
                detailUrl: request.url,
            });
        }
    },
});

await crawler.run();
await Actor.exit();
