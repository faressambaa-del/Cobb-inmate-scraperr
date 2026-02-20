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

    requestHandlerTimeoutSecs: 60,

    preNavigationHooks: [
        async ({ request }) => {
            request.headers = {
                ...request.headers,
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                Referer:
                    'http://inmate-search.cobbsheriff.org/enter_name.htm',
            };
        },
    ],

    async requestHandler({ $, request }) {

        const label = request.userData.label;

        if (label === 'LIST') {

            console.log('Processing search results page');

            const links = [];

            $('a').each((_, el) => {
                const href = $(el).attr('href');

                if (href && href.includes('InmDetails.asp')) {
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
