import { NATIONAL_PARKS } from './src/data/parks.js';

async function checkUrls() {
    const results = [];
    for (const park of NATIONAL_PARKS) {
        const url = `https://www.nps.gov/${park.parkCode}/planyourvisit/vehicle_reservations.htm`;
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
                results.push({ parkCode: park.parkCode, name: park.name, status: 'Found', url });
            } else {
                // Try a common alternative
                const altUrl = `https://www.nps.gov/${park.parkCode}/planyourvisit/timed-entry-reservation.htm`;
                const altResponse = await fetch(altUrl, { method: 'HEAD' });
                if (altResponse.ok) {
                    results.push({ parkCode: park.parkCode, name: park.name, status: 'Found (Alt)', url: altUrl });
                } else {
                    results.push({ parkCode: park.parkCode, name: park.name, status: 'Not Found' });
                }
            }
        } catch (e) {
            results.push({ parkCode: park.parkCode, name: park.name, status: 'Error', error: e.message });
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

checkUrls();
