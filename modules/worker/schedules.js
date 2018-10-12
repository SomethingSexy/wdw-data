"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
const index_1 = require("../index");
const log_1 = __importDefault(require("../log"));
/**
 * Service for updating hours
 */
exports.default = async (days) => {
    // setup our database connection
    const models = await index_1.createModels({
        database: 'wdw',
        logging: true,
        pool: {
            max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
        },
        username: 'tylercvetan',
    }, log_1.default);
    const realtimeModels = index_1.realtime(log_1.default);
    const startDate = moment_1.default().format('YYYY-MM-DD');
    const endDate = days ? moment_1.default().add(days, 'days').format('YYYY-MM-DD') : startDate;
    // fetch all locations that can add schedules
    const parks = await models.location.findAll({ fetchSchedule: true });
    const responses = await Promise.all(parks.reduce((all, park) => {
        return [
            ...all,
            realtimeModels.parks.hours(park.data, startDate, endDate)
                .then(p => (Object.assign({}, p, { id: park.data.id })))
        ];
    }, []));
    // loop through all of the locations, find if there is a schedule then add it
    for (const park of parks) {
        const parkSchedule = responses.find(response => response.id === park.data.id);
        if (parkSchedule) {
            await park.bulkAddSchedules(parkSchedule.schedule);
        }
    }
    // get all activities that can fetch schedules
    const entertainment = await models.activity.findAll({ fetchSchedule: true });
    log_1.default.log('info', 'retrieving entertainment schedules');
    let entertainmentSchedules = await realtimeModels.entertainment.schedule(startDate);
    log_1.default.log('info', 'retrieved entertainment schedules');
    entertainmentSchedules = entertainmentSchedules
        .reduce((all, eS) => {
        const found = entertainment.find(e => e.data.extId === eS.id);
        if (!found) {
            return all;
        }
        return [
            ...all,
            Object.assign({}, eS, { id: found.data.id })
        ];
    }, []);
    for (const activity of entertainment) {
        log_1.default.log('info', 'Adding schedule to database');
        const activitySchedule = entertainmentSchedules.find(response => response.id === activity.data.id);
        if (activitySchedule) {
            await activity.bulkAddSchedules(activitySchedule.schedule);
        }
    }
    return null;
};
//# sourceMappingURL=schedules.js.map