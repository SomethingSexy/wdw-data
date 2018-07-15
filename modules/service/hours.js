"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const park_1 = __importDefault(require("../model/park"));
const parks_1 = require("../realtime/parks");
/**
 * Service for updating hours
 */
exports.default = async (days) => {
    const startDate = moment_1.default().format('YYYY-MM-DD');
    const endDate = days ? moment_1.default().add(days, 'days').format('YYYY-MM-DD') : startDate;
    const parks = await park_1.default.getAll();
    const responses = await Promise.all(parks.reduce((all, park) => {
        if (park.retrieveHours === false) {
            return all;
        }
        return [
            ...all,
            parks_1.hours(park, startDate, endDate)
                .then(schedule => ({ schedule, id: park.id }))
        ];
    }, []));
    for (const parkSchedule of responses) {
        // console.log(JSON.stringify(parkSchedule, null, 4));
        // TODO this is not going to work right now because of how we are reading/wrting the files
        await park_1.default.addSchedule(parkSchedule.id, parkSchedule.schedule);
    }
    return responses;
};
//# sourceMappingURL=hours.js.map