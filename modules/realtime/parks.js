"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
const request_1 = require("./api/request");
const screen_1 = require("./api/screen");
const utils_1 = require("./utils");
const DESTINATION_ID = 80007798;
const path = 'https://disneyworld.disney.go.com/destinations/';
const PARK_REGION = 'us';
// const TIME_ZONE = 'America/New_York';
// const DATE_FORMAT = 'YYYY-MM-DD';
exports.list = async () => {
    const screen = await screen_1.grab(path);
    return screen.getItems();
};
exports.parkHours = async (park, start, end) => {
    const parsed = utils_1.parseExternal(park.extId);
    if (!parsed) {
        throw new Error('Cannot parse external id when trying to fetch wait times');
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