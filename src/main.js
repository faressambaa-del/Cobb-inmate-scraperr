async requestHandler({ request, page, log }) {
    log.info(`Processing: ${request.url}`);

    // Wait for results table to load
    await page.waitForSelector('table', { timeout: 60000 });

    // Extract the Last Known Booking link
    const bookingLink = await page
        .locator('a:has-text("Last Known Booking")')
        .first()
        .getAttribute('href');

    if (!bookingLink) {
        log.warning('No "Last Known Booking" link found.');
        return;
    }

    const fullUrl = new URL(bookingLink, page.url()).href;
    log.info(`Navigating to booking details: ${fullUrl}`);

    // Go to booking details page
    await page.goto(fullUrl, { waitUntil: 'networkidle' });

    // Wait for details page to load
    await page.waitForSelector('text=Booking Information', { timeout: 60000 });

    // Scrape structured data
    const data = await page.evaluate(() => {

        const extractRowValue = (label) => {
            const cells = Array.from(document.querySelectorAll('td'));
            for (let i = 0; i < cells.length; i++) {
                if (cells[i].innerText.trim() === label) {
                    return cells[i + 1]?.innerText.trim() || null;
                }
            }
            return null;
        };

        return {
            name: extractRowValue('Name'),
            dob: extractRowValue('DOB'),
            raceSex: extractRowValue('Race/Sex'),
            location: extractRowValue('Location'),
            soid: extractRowValue('SOID'),
            daysInCustody: extractRowValue('Days in Custody'),
            agencyId: extractRowValue('Agency ID'),
            arrestDateTime: extractRowValue('Arrest Date/Time'),
            bookingStarted: extractRowValue('Booking Started'),
            bookingComplete: extractRowValue('Booking Complete'),
            height: extractRowValue('Height'),
            weight: extractRowValue('Weight'),
            hair: extractRowValue('Hair'),
            eyes: extractRowValue('Eyes'),
            address: extractRowValue('Address'),
            city: extractRowValue('City'),
            state: extractRowValue('State'),
            zip: extractRowValue('Zip'),
            placeOfBirth: extractRowValue('Place of Birth'),
        };
    });

    log.info('Scraped data:', data);

    // Push to dataset
    await Actor.pushData(data);
}
