"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const invariant_1 = __importDefault(require("invariant"));
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
const request_1 = require("./api/request");
const utils_1 = require("./utils");
const DESTINATION_ID = 80007798;
const path = 'https://disneyworld.disney.go.com/destinations/';
const PARK_REGION = 'us';
// const TIME_ZONE = 'America/New_York';
// const DATE_FORMAT = 'YYYY-MM-DD';
const additionalData = {
    '80008033;entityType=Entertainment-Venue': {
        // tslint:disable-next-line:max-line-length
        description: 'Play at the next level at ESPN Wide World of Sports Complex. These 230 acres of professionally run, state-of-the-art facilities host over 60 sports and thousands of events for athletes of all ages and abilities. Train and compete with your team—or catch the excitement as a spectator—in this grand sports setting where classic athletic ideals meet contemporary innovation.',
    },
    // tslint:disable-next-line:object-literal-sort-keys
    '10460;entityType=Entertainment-Venue': {
        // tslint:disable-next-line:max-line-length
        description: 'Welcome to Disney Springs—a truly amazing place featuring an eclectic mix of unique boutiques, one-of-a-kind eateries and jaw-dropping entertainment that will have you wondering where the day went. '
    },
    '80008259;entityType=Entertainment-Venue': {
        // tslint:disable-next-line:max-line-length
        description: 'Experience the timeless charm of Disney’s BoardWalk, a quarter-mile promenade of exquisite dining, unique shops and exciting nightlife. Stroll along the water’s edge, play afternoon midway games and discover evening street performers. Evoking turn-of-the-century boardwalks in such coastal cities as Coney Island and Atlantic City, Disney’s BoardWalk is a short stroll to Epcot and a breezy boat ride to Disney’s Hollywood Studios.'
    },
    '80007823;entityType=theme-park': {
        description: 'Behold the Magic of Nature with Rare Animals and World-Class Entertainment',
        image: 'animal-kingdom'
    },
    '80007834;entityType=water-park': {
        // tslint:disable-next-line:max-line-length
        description: 'Discover frosty fun for the whole family at Disney’s Blizzard Beach water park, a one-time ski resort that has melted into a watery wonderland. Zip down the slushy slopes of Mount Gushmore on one of the world’s tallest and fastest waterslides. Float down the tranquil river and sunbathe on the white-sand beach. Children under 48 inches tall can even splash around in their own water play area with a snow-castle fountain and kid-sized waterslides.'
    },
    '80007998;entityType=theme-park': {
        description: 'Take Center Stage in the Worlds of Movies, Television, Music & Theater',
        image: 'hollywood-studios'
    },
    '80007838;entityType=theme-park': {
        description: 'Travel Around the Globe, Under the Sea, into Outer Space… and Beyond!',
        image: 'epcot'
    },
    '80007944;entityType=theme-park': {
        description: 'Explore Lands of Endless Enchantment, Where Your Fantasy Becomes a Reality',
        image: 'magic-kingdom'
    },
    '80007981;entityType=water-park': {
        // tslint:disable-next-line:max-line-length
        description: 'Soak up a storm of fun under the Florida sun—plunge down rushing rapids, sunbathe on a sandy beach, glide down a lazy river, and enjoy the thrills and spills of the whitewater journey called Miss Adventure Falls!'
    }
};
exports.list = async (logger) => {
    logger('info', `Grabbing park screen for ${path}.`);
    const response = await request_1.screen(path);
    const $ = cheerio_1.default(response);
    const $parkCards = $.find('li.card');
    logger('info', `Total of ${$parkCards.length} to process.`);
    const items = [];
    for (let i = 0; i < $parkCards.length; i += 1) {
        const card = $parkCards.get(i);
        let location = null;
        let area = null;
        let type;
        let extId;
        let extRefName;
        const $card = cheerio_1.default(card);
        const external = $card.attr('data-entityid');
        const name = $card.find('.cardName').text();
        const parsedExternal = utils_1.parseExternal(external);
        if (parsedExternal) {
            extId = parsedExternal.extId;
            type = parsedExternal.type;
        }
        // if (!type) {
        //   return undefined;
        // }
        const url = $card
            .find('.cardLinkOverlay')
            .attr('href');
        // not every place has a url, for example the California Grill Lounge
        if (url) {
            extRefName = url.substring(path.length, url.length);
            // depending on the url, might be additonal segements we need to remove
            extRefName = extRefName.substring(extRefName.indexOf('/') === extRefName.length - 1 ? 0 : extRefName.indexOf('/') + 1, extRefName.length - 1);
        }
        const fullLocation = utils_1.parseLocation($card.find('span[aria-label=location]').text());
        if (fullLocation) {
            location = fullLocation.location;
            area = fullLocation.area;
        }
        let park = {
            area,
            extId,
            extRefName,
            location,
            name,
            type,
            url
        };
        if (additionalData[park.extId]) {
            park = Object.assign({}, park, additionalData[park.extId]);
        }
        items.push(park);
    }
    return items;
};
exports.parkHours = async (park, start, end) => {
    const parsed = utils_1.parseExternal(park.extId);
    if (!parsed) {
        throw new Error('Cannot parse external id when trying to fetch hours');
    }
    // TODO: validate YYYY-MM-DD
    const auth = await request_1.getAccessToken();
    const url = `/mobile-service/public/ancestor-activities-schedules/${park.extId}`;
    const data = {
        endDate: end || start,
        filters: park.type,
        region: PARK_REGION,
        startDate: start
    };
    const response = await request_1.get(url, data, auth);
    // console.log(response.ancestor.schedule.schedules);
    invariant_1.default(response.activities, `Issue parsing hours response.  Property activities is missing for park ${park.extId}`);
    const dates = response.activities.reduce((all, activity) => {
        if (!activity.schedule) {
            return all;
        }
        // const extId = activity.id;
        const { schedules } = activity.schedule;
        return schedules.reduce((byDate, schedule) => {
            const { date, endTime, startTime, type } = schedule;
            const opening = moment_1.default(`${date} ${startTime}`);
            // type = 'Special Ticketed Event' might be early morning magic, or after hours magic
            const dateSchedule = {
                type,
                closing: moment_1.default(`${date} ${endTime}`).utc().format(),
                isSpecialHours: (type !== 'Operating' && type !== 'Closed' && type !== 'Refurbishment'),
                opening: opening.utc().format(),
            };
            const updatedDate = !byDate[date]
                ? [dateSchedule] : [...byDate[schedule.date], dateSchedule];
            return Object.assign({}, byDate, { [schedule.date]: updatedDate });
        }, {});
    }, {});
    return {
        id: park.extId,
        schedule: dates
    };
};
exports.waitTimes = async (park) => {
    const parsed = utils_1.parseExternal(park.extId);
    if (!parsed) {
        throw new Error('Cannot parse external id when trying to fetch wait times');
    }
    const url = `/facility-service/theme-parks/${parsed.id};destination=${DESTINATION_ID}/wait-times`;
    const auth = await request_1.getAccessToken();
    const response = await request_1.get(url, {}, auth);
    return response.entries.map(element => {
        return {
            extId: element.id,
            waitTime: element.waitTime
        };
    });
};
//# sourceMappingURL=parks.js.map