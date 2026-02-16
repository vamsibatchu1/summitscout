import fs from 'fs';
import { NATIONAL_PARKS } from '../src/data/parks.js';

async function scrapeFeesStructured() {
    const feesData = {};
    const totalParks = NATIONAL_PARKS.length;

    console.log(`Starting structured data collection for ${totalParks} parks...`);

    for (let i = 0; i < totalParks; i++) {
        const park = NATIONAL_PARKS[i];
        const { parkCode, name } = park;
        const url = `https://www.nps.gov/${parkCode}/structured_data_${parkCode}.json`;

        console.log(`[${i + 1}/${totalParks}] Fetching structured data for ${name} (${parkCode})...`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`  Failed to fetch ${url}: ${response.statusText}`);
                feesData[parkCode] = { error: "Fee information not available." };
                continue;
            }

            const data = await response.json();

            feesData[parkCode] = {
                entranceFees: (data.entranceFees || []).map(fee => ({
                    title: fee.title || fee.entranceFeeType,
                    cost: fee.cost,
                    description: fee.description || ""
                })),
                entrancePasses: (data.entrancePasses || []).map(pass => ({
                    title: pass.title || pass.entrancePassType,
                    cost: pass.cost,
                    description: pass.description || ""
                })),
                otherFees: (data.fees || []).map(fee => ({
                    title: fee.title,
                    cost: fee.cost,
                    description: fee.message || fee.description || ""
                })),
                otherPasses: (data.passes || []).map(pass => ({
                    title: pass.title,
                    cost: pass.cost,
                    description: pass.message || pass.description || ""
                }))
            };

            console.log(`  Successfully processed ${feesData[parkCode].entranceFees.length} fees and ${feesData[parkCode].entrancePasses.length} passes for ${parkCode}.`);

        } catch (error) {
            console.error(`  Error processing ${parkCode}:`, error.message);
            feesData[parkCode] = { error: error.message };
        }

        // Polite delay
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    const outputPath = './src/data/intelligence/fees.json';
    fs.writeFileSync(outputPath, JSON.stringify(feesData, null, 2));
    console.log(`\nFinished! Structured data saved to ${outputPath}.`);
}

scrapeFeesStructured();
