import fs from 'fs';
import { NATIONAL_PARKS } from './src/data/parks.js';

async function scrapeFees() {
    const feesData = {};
    const totalParks = NATIONAL_PARKS.length;

    console.log(`Starting data collection for ${totalParks} parks via structured JSON API...`);

    for (let i = 0; i < totalParks; i++) {
        const park = NATIONAL_PARKS[i];
        const { parkCode, name } = park;
        const url = `https://www.nps.gov/${parkCode}/structured_data_${parkCode}.json`;

        console.log(`[${i + 1}/${totalParks}] Fetching data for ${name} (${parkCode})...`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`  Failed to fetch ${url}: ${response.statusText}`);
                feesData[parkCode] = "Fee information not available.";
                continue;
            }

            const data = await response.json();

            let consolidatedText = "";

            // Extract entrance fees
            if (data.entranceFees && data.entranceFees.length > 0) {
                consolidatedText += "ENTRANCE FEES: ";
                consolidatedText += data.entranceFees.map(fee =>
                    `${fee.title || fee.entranceFeeType}: $${fee.cost} - ${fee.description || ""}`
                ).join(" | ");
                consolidatedText += " ";
            }

            // Extract entrance passes
            if (data.entrancePasses && data.entrancePasses.length > 0) {
                consolidatedText += "ENTRANCE PASSES: ";
                consolidatedText += data.entrancePasses.map(pass =>
                    `${pass.title || pass.entrancePassType}: $${pass.cost} - ${pass.description || ""}`
                ).join(" | ");
                consolidatedText += " ";
            }

            // Extract other fees (like timed entry)
            if (data.fees && data.fees.length > 0) {
                consolidatedText += "OTHER FEES: ";
                consolidatedText += data.fees.map(fee =>
                    `${fee.title}: $${fee.cost} - ${fee.message || fee.description || ""}`
                ).join(" | ");
                consolidatedText += " ";
            }

            // Extract other passes
            if (data.passes && data.passes.length > 0) {
                consolidatedText += "OTHER PASSES: ";
                consolidatedText += data.passes.map(pass =>
                    `${pass.title}: $${pass.cost} - ${pass.message || pass.description || ""}`
                ).join(" | ");
                consolidatedText += " ";
            }

            if (consolidatedText) {
                feesData[parkCode] = consolidatedText.trim();
                console.log(`  Successfully processed data for ${parkCode}.`);
            } else {
                console.warn(`  No fee data found in JSON for ${parkCode}.`);
                feesData[parkCode] = "No structured fee data found.";
            }

        } catch (error) {
            console.error(`  Error processing ${parkCode}:`, error.message);
            feesData[parkCode] = `Error: ${error.message}`;
        }

        // Delay to be polite
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    fs.writeFileSync('fees.json', JSON.stringify(feesData, null, 2));
    console.log("\nFinished! Data saved to fees.json.");
}

scrapeFees();
