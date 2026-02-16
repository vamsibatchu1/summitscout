import fs from 'fs';
import { NATIONAL_PARKS } from './src/data/parks.js';

const KNOWN_RESERVATION_PAGES = {
    'acad': 'https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm',
    'arch': 'https://www.nps.gov/arch/planyourvisit/timed-entry-pilot.htm',
    'glac': 'https://www.nps.gov/glac/planyourvisit/vehiclereservations.htm',
    'romo': 'https://www.nps.gov/romo/planyourvisit/timed-entry-reservations.htm',
    'yose': 'https://www.nps.gov/yose/planyourvisit/reservations.htm',
    'mora': 'https://www.nps.gov/mora/planyourvisit/timed-entry-reservations.htm',
    'hale': 'https://www.nps.gov/hale/planyourvisit/sunrise-reservations.htm',
    'cave': 'https://www.nps.gov/cave/planyourvisit/reservations.htm',
    'shen': 'https://www.nps.gov/shen/planyourvisit/old-rag-hiking-reservations.htm'
};

async function collectVehicleData() {
    const rawData = {};
    for (const park of NATIONAL_PARKS) {
        const { parkCode, name } = park;
        let url = KNOWN_RESERVATION_PAGES[parkCode] || `https://www.nps.gov/${parkCode}/planyourvisit/vehicle_reservations.htm`;

        console.log(`Checking ${name} (${parkCode})...`);

        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                // Extract main content
                const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
                if (contentMatch) {
                    let text = contentMatch[1]
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    rawData[parkCode] = { text, url };
                } else {
                    rawData[parkCode] = { text: "No content found in article/main.", url };
                }
            } else {
                rawData[parkCode] = { text: "NO_RESERVATION_REQUIRED", url: `https://www.nps.gov/${parkCode}/index.htm` };
            }
        } catch (e) {
            rawData[parkCode] = { text: "ERROR_FETCHING", url, error: e.message };
        }
        await new Promise(r => setTimeout(r, 200));
    }
    fs.writeFileSync('raw_vehicle_data.json', JSON.stringify(rawData, null, 2));
    console.log("Raw data collection complete. Saved to raw_vehicle_data.json");
}

collectVehicleData();
