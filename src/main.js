async requestHandler({ $, request }) {
    console.log(`Processing ${request.url}`);

    const tables = $('table');
    console.log(`Total tables found: ${tables.length}`);

    let dataFound = false;

    tables.each((i, table) => {
        const rows = $(table).find('tr');

        // We want tables that have actual data rows
        if (rows.length > 1) {
            console.log(`Checking table ${i} with ${rows.length} rows`);

            rows.slice(1).each((_, row) => {
                const cells = $(row).find('td');

                if (cells.length >= 4) {
                    const record = {
                        name: $(cells[1]).text().trim(),
                        dob: $(cells[2]).text().trim(),
                        race: $(cells[3]).text().trim(),
                    };

                    // Only push real inmate rows
                    if (record.name && record.name !== 'Name') {
                        dataFound = true;
                        results.push(record);
                    }
                }
            });
        }
    });

    if (!dataFound) {
        console.log("⚠️ No inmate records found on this page.");
    } else {
        console.log(`✅ Extracted ${results.length} inmate records.`);
    }
}
