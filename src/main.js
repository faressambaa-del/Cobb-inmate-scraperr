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

    async requestHandler({ $, request, enqueueLinks }) {

        // =========================
        // LIST PAGE (search results)
        // =========================
        if (request.label === 'LIST') {

            console.log('Processing search results page');

            $('table tr').each((_, row) => {
                const cells = $(row).find('td');

                if (cells.length > 5) {

                    const name = $(cells[1]).text().trim();
                    const soid = $(cells[6]).text().trim();

                    const bookingLink = $(cells[8]).find('a').attr('href');

                    if (bookingLink) {
                        const fullUrl = `http://inmate-search.cobbsheriff.org/${bookingLink}`;

                        console.log('Queueing booking page:', fullUrl);

                        requestQueue.addRequest({
                            url: fullUrl,
                            label: 'DETAIL',
                            userData: { name },
                        });
                    }
                }
            });
        }

        // =========================
        // DETAIL PAGE (booking info)
        // =========================
        if (request.label === 'DETAIL') {

            console.log('Processing booking detail page');

            const name = $('td:contains("Name")')
                .next()
                .text()
                .trim();

            const dob = $('td:contains("DOB")')
                .next()
                .text()
                .trim();

            const raceSex = $('td:contains("Race/Sex")')
                .next()
                .text()
                .trim();

            const location = $('td:contains("Location")')
                .next()
                .text()
                .trim();

            const soid = $('td:contains("SOID")')
                .next()
                .text()
                .trim();

            const days = $('td:contains("Days in Custody")')
                .next()
                .text()
                .trim();

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
