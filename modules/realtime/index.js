"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attractions_1 = require("./attractions");
const dining_1 = require("./dining");
const entertainment_1 = require("./entertainment");
const hotels_1 = require("./hotels");
const parks_1 = require("./parks");
exports.attractions = (logger) => {
    return {
        get: attractions_1.get,
        list: (options) => attractions_1.list(logger, options),
    };
};
exports.entertainment = (logger) => {
    return {
        schedule: entertainment_1.schedule,
        list: (options) => entertainment_1.list(logger, options) // tslint:disable-line
    };
};
exports.dining = (logger) => {
    return {
        reservations: dining_1.reservations,
        get: dining_1.get,
        list: (options) => dining_1.list(logger, options),
    };
};
exports.hotels = (logger) => {
    return {
        list: () => hotels_1.list(logger),
    };
};
exports.parks = (logger) => {
    return {
        waitTimes: parks_1.waitTimes,
        hours: parks_1.parkHours,
        list: () => parks_1.list(logger)
    };
};
//# sourceMappingURL=index.js.map