"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
const index_1 = __importDefault(require("../data/index"));
const parks_1 = require("../realtime/parks");
/**
 * Service for updating hours
 */
exports.default = async () => {
    // setup our database connection
    const models = await index_1.default();
    const parks = await models.location.list();
    // save the same timestamp for all
    const timeStamp = moment_1.default.utc().format();
    const responses = await Promise.all(parks.reduce((all, park) => {
        return [
            ...all,
            parks_1.waitTimes(park)
        ];
    }, []));
    for (const waitTime of responses) {
        await models.activity.addWaitTimes(timeStamp, waitTime);
    }
    return responses;
};
//# sourceMappingURL=waittimes.js.map