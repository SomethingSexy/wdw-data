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
        items.push({
            area,
            extId,
            extRefName,
            location,
            name,
            type,
            url
        });
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