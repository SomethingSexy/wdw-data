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
    const parks = await models.location.list({ fetchSchedule: true });
    const responses = await Promise.all(parks.reduce((all, park) => {
        return [
            ...all,
            realtimeModels.parks.hours(park, startDate, endDate)
                .then(p => (Object.assign({}, p, { id: park.id })))
        ];
    }, []));
    for (const parkSchedule of responses) {
        await models.location.addSchedules(parkSchedule.id, parkSchedule.schedule);
    }
    // get all activities that can fetch schedules
    const entertainment = await models.activity.list({ fetchSchedule: true });
    log_1.default.log('info', 'retrieving entertainment schedules');
    let entertainmentSchedules = await realtimeModels.entertainment.schedule(startDate);
    log_1.default.log('info', 'retrieved entertainment schedules');
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
        log_1.default.log('info', 'Adding schedule to database');
        await models.activity.addSchedules(entertainmentSchedule.id, entertainmentSchedule.schedule);
    }
    return null;
};
//# sourceMappingURL=schedules.js.map