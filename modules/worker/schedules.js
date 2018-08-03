"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
const index_1 = __importDefault(require("../data/index"));
const entertainment_1 = require("../realtime/entertainment");
const parks_1 = require("../realtime/parks");
/**
 * Service for updating hours
 */
exports.default = async (days) => {
    // setup our database connection
    const models = index_1.default();
    const startDate = moment_1.default().format('YYYY-MM-DD');
    const endDate = days ? moment_1.default().add(days, 'days').format('YYYY-MM-DD') : startDate;
    const parks = await models.location.list({ fetchSchedule: true });
    const responses = await Promise.all(parks.reduce((all, park) => {
        return [
            ...all,
            parks_1.parkHours(park, startDate, endDate)
                .then(p => (Object.assign({}, p, { id: park.id })))
        ];
    }, []));
    // console.log('parks', responses);
    for (const parkSchedule of responses) {
        await models.location.addParkSchedules(parkSchedule.id, parkSchedule.schedule);
    }
    // get all activities that can fetch schedules
    const entertainment = await models.activity.list({ fetchSchedule: true });
    let entertainmentSchedules = await entertainment_1.schedule('2018-08-03');
    entertainmentSchedules = entertainmentSchedules
        .reduce((all, eS) => {
        const found = entertainment.find(e => e.extId === eS.id);
        if (!found) {
            return all;
        }
        return [
            ...all,
            Object.assign({}, eS, { id: found.id })
        ];
    }, []);
    for (const entertainmentSchedule of entertainmentSchedules) {
        await models.activity.addSchedules(entertainmentSchedule.id, entertainmentSchedule.schedule);
    }
    return null;
};
//# sourceMappingURL=schedules.js.map