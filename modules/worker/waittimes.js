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
exports.default = async () => {
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
    const parks = await models.location.list();
    // save the same timestamp for all
    const timeStamp = moment_1.default.utc().format();
    const responses = await Promise.all(parks.reduce((all, park) => {
        return [
            ...all,
            realtimeModels.parks.waitTimes(park)
        ];
    }, []));
    for (const waitTime of responses) {
        await models.activity.addWaitTimes(timeStamp, waitTime);
    }
    return responses;
};
//# sourceMappingURL=waittimes.js.map