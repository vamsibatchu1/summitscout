import fs from 'fs';
import { NATIONAL_PARKS } from './src/data/parks.js';

const SUMMARIES = {
    'acad': {
        'summary': 'Vehicle reservations are required for Cadillac Summit Road from late May through October to manage congestion at one of the park\'s most popular viewing spots. Reservations are released in two windows: 30 percent are available 90 days in advance, and the remaining 70 percent are released nearly two days before the reservation date. \n\nThe reservation costs $6 and must be purchased online at Recreation.gov; they are not available for purchase at the park. Visitors must also have a valid park entrance pass in addition to their vehicle reservation. Note that vehicles over 21 feet long and trailers are prohibited on this narrow road.',
        'url': 'https://www.nps.gov/acad/planyourvisit/vehicle_reservations.htm'
    },
    'arch': {
        'summary': 'Arches National Park utilizes a timed entry reservation system during the peak season, typically from April 1 to October 31, to regulate vehicle flow into the park. This system requires visitors to book a specific entry window in advance through Recreation.gov, effectively reducing wait times and protecting the park\'s fragile desert environment.\n\nWhile the reservation is required for entry during peak hours, visitors can enter before or after these times without a booking. It is important to remember that a timed entry ticket is distinct from the park entrance fee, which must also be paid or covered by a valid pass. Tribal members and those with existing camping or backcountry permits are exempt from this requirement.',
        'url': 'https://www.nps.gov/arch/planyourvisit/timed-entry-pilot.htm'
    },
    'glac': {
        'summary': 'Glacier National Park requires vehicle reservations for the West Entrance of Going-to-the-Sun Road and the North Fork area from late May through September. These timed entry permits are necessary between 7 am and 3 pm to ensure visitors have a high-quality experience without excessive traffic. Reservations are released on a rolling basis 120 days in advance, with a portion held for release 24 hours before the entry date.\n\nVisitors entering the park from the east side at St. Mary do not require a reservation to drive west, though they cannot pass through the Apgar Check Point without one during restricted hours. Areas like Many Glacier and Two Medicine may have their own specific access rules, often tied to construction or parking availability, so checking the latest park alerts is recommended.',
        'url': 'https://www.nps.gov/glac/planyourvisit/vehiclereservations.htm'
    },
    'romo': {
        'summary': 'Rocky Mountain National Park implements a dual-option timed entry permit system from May through mid-October. The first option covers the highly popular Bear Lake Road corridor and requires a reservation for entry between 5 am and 6 pm, while the second option covers the rest of the park (excluding Bear Lake Road) and is required from 9 am to 2 pm. These permits are essential for managing the park\'s millions of annual visitors.\n\nPermits are released in monthly blocks on Recreation.gov, with about 40 percent of total capacity held for next-day release at 7 pm. Each reservation carries a $2 processing fee. While the system manages vehicle volume, visitors with valid permits are free to stay as long as they wish once they have entered during their allotted window.',
        'url': 'https://www.nps.gov/romo/planyourvisit/timed-entry-permit-system.htm'
    },
    'yose': {
        'summary': 'Yosemite National Park is currently reviewing its vehicle reservation program and has frequently adjusted its requirements for the 2025 and 2026 seasons. In previous years, the park utilized "Peak Hours Plus" reservations during the busiest months to manage crowding and protect the valley. Visitors are strongly advised to check the official Yosemite NPS website for the most current updates regarding the 2026 season requirements.\n\nEven when general vehicle reservations are not in effect, specific events like the Horsetail Fall "firefall" in February or highly popular hiking trails may require specialized permits. Standard entrance fees always apply, and reservations for lodging, camping, or wilderness permits typically include park entry for the duration of the stay.',
        'url': 'https://www.nps.gov/yose/planyourvisit/reservations.htm'
    },
    'mora': {
        'summary': 'Mount Rainier National Park has introduced a timed entry pilot program for the Sunrise and White River corridors during the peak summer months, typically from July to early September. This system aims to provide more reliable access to the high-elevation views and trails of the Sunrise area by requiring a pre-booked entry window between 7 am and 5 pm. Reservations are typically released 90 days in advance on Recreation.gov.\n\nIn a change for the 2025 season, the popular Paradise corridor does not require timed entry reservations, though this is subject to change in future years based on park evaluations. Visitors with existing reservations for camping or lodging within the affected corridors do not need an additional timed entry permit. Standard park entrance fees still apply and are separate from the $2 reservation fee.',
        'url': 'https://www.nps.gov/mora/planyourvisit/timed-entry-reservations.htm'
    },
    'hale': {
        'summary': 'Haleakalā National Park requires vehicle reservations for any visitor wishing to view the sunrise from the summit between 3 am and 7 am. Because this is the park\'s most popular attraction, the reservation system is critical for managing parking and visitor safety at the 10,023-foot peak. These tickets are exclusively available online through Recreation.gov and often sell out within minutes of being released.\n\nReservations are released in two phases: 60 days in advance and a smaller portion 48 hours before the visit date. Each visitor is limited to one reservation per three-day period to ensure fair access. In addition to the sunrise ticket, a standard park entrance fee or pass is required upon entry at the park gate.',
        'url': 'https://www.nps.gov/hale/planyourvisit/sunrise.htm'
    },
    'cave': {
        'summary': 'Carlsbad Caverns National Park strongly recommends timed entry reservations for all visitors wishing to enter the main cavern. This system ensures that the underground environment is not overcrowded and that visitors have a predictable entry time for their self-guided exploration or ranger-led tours. Reservations can be made on Recreation.gov and carry a small processing fee.\n\nIt is important to note that the timed entry reservation only secures your arrival window; the actual entrance fee must be paid separately at the visitor center upon arrival unless you hold a valid pass. Guided tours of specific caves like King\'s Palace or Lower Cave require their own separate reservations and often sell out well in advance of the visit date.',
        'url': 'https://www.nps.gov/cave/planyourvisit/reservations.htm'
    },
    'zion': {
        'summary': 'While Zion National Park does not currently require a general vehicle reservation for park entry, many of its most iconic activities require specialized permits. Most notably, a permit is required to hike the final "chains" section of the Angels Landing trail, distributed through seasonal and day-before lotteries. Other backcountry adventures, like the "Subway" or top-down hikes in the Narrows, also require wilderness permits.\n\nThe park\'s primary shuttle system, which services the Zion Canyon Scenic Drive during peak months, does not require a reservation and is free for all visitors. However, because the park is extremely popular, parking at the Zion Canyon Visitor Center often fills up early in the day, making the local Springdale shuttle a vital alternative for many travelers.',
        'url': 'https://www.nps.gov/zion/planyourvisit/basicinfo.htm'
    },
    'shen': {
        'summary': 'Shenandoah National Park does not require a general vehicle reservation to drive the scenic Skyline Drive, but it does require a day-use ticket for hiking the popular Old Rag Mountain. This pilot program, running from March through November, helps manage the high density of hikers on this challenging and ecologically sensitive trail. Tickets are released on a rolling basis and must be obtained via Recreation.gov.\n\nFor the rest of the park, visitors can enter freely with a standard entrance pass. The park is particularly busy during the fall foliage season, and while reservations aren\'t required for entry, parking at popular trailheads like Whiteoak Canyon can become extremely limited. Planning to arrive early or visit on weekdays is highly recommended to avoid the heaviest crowds.',
        'url': 'https://www.nps.gov/shen/planyourvisit/old-rag-hiking-reservations.htm'
    }
};

function generateFinalJson() {
    const finalData = {};
    for (const park of NATIONAL_PARKS) {
        const { parkCode, name } = park;
        if (SUMMARIES[parkCode]) {
            finalData[parkCode] = SUMMARIES[parkCode];
        } else {
            finalData[parkCode] = {
                'summary': `Vehicle reservations are not required to enter ${name} for general visitation. Visitors can access the park at any time during its operating hours by paying the standard entrance fee or presenting a valid national park pass at the entry station. This makes it an ideal destination for spontaneous travelers who want to avoid the pre-planning required by some other major parks.\n\nWhile entry is open, specific activities within the park, such as commercial tours, special events, or overnight backcountry camping, may still require permits. It is always a good idea to check the park's official website for any seasonal alerts or temporary closures that might affect access to specific roads or facilities within the park.`,
                'url': `https://www.nps.gov/${parkCode}/index.htm`
            };
        }
    }
    fs.writeFileSync('vehicle_permits.json', JSON.stringify(finalData, null, 2));
    console.log("Final vehicle_permits.json generated successfully.");
}

generateFinalJson();
