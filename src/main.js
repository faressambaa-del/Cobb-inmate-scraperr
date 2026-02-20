import { Actor } from 'apify';
import { CheerioCrawler, RequestQueue } from 'crawlee';

await Actor.init();

// Search URL
const START_URL =
    'http://inmate-search.cobbsheriff.org/inquiry.asp?soid=&inmate_name=Rankin+Shawn&serial=&qry=In+Custody';

const requestQueue = await RequestQueue.open();
await requestQueue.addRequest({ url: START_URL });

const crawler = new CheerioCrawler({
    requestQueue,

    async requestHandler({ request, $, enqueueLinks, log }) {
        log.info(`Processing: ${request.url}`);

        // If we're on the search page
        if (request.url.includes('inquiry.asp')) {

            const bookingLink = $('a[href*="InmDetails.asp"]').first().attr('href');

            if (!bookingLink) {
                log.warning('No booking link found on search results page.');
                return;
            }

            const fullUrl = new URL(bookingLink, request.url).href;

            log.info(`Found booking details URL: ${fullUrl}`);

            await requestQueue.addRequest({ url: fullUrl });
            return;
        }

        // If we're on the details page
        if (request.url.includes('InmDetails.asp')) {

            const extractValue = (label) => {
                const cell = $('td').filter(function () {
                    return $(this).text().trim() === label;
                }).first();

                return cell.next('td').text().trim() || null;
            };

            const data = {
                name: extractValue('Name'),
                dob: extractValue('DOB'),
                raceSex: extractValue('Race/Sex'),
                location: extractValue('Location'),
                soid: extractValue('SOID'),
                daysInCustody: extractValue('Days in Custody'),
                agencyId: extractValue('Agency ID'),
                arrestDateTime: extractValue('Arrest Date/Time'),
                bookingStarted: extractValue('Booking Started'),
                bookingComplete: extractValue('Booking Complete'),
                height: extractValue('Height'),
                weight: extractValue('Weight'),
                hair: extractValue('Hair'),
                eyes: extractValue('Eyes'),
                address: extractValue('Address'),
                city: extractValue('City'),
                state: extractValue('State'),
                zip: extractValue('Zip'),
                placeOfBirth: extractValue('Place of Birth'),
            };

            log.info('Scraped data:', data);

            await Actor.pushData(data);
        }
    },
});

await crawler.run();
await Actor.exit();
