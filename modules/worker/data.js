"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("../data/index"));
const attractions_1 = require("../realtime/attractions");
const entertainment_1 = require("../realtime/entertainment");
const hotels_1 = require("../realtime/hotels");
const parks_1 = require("../realtime/parks");
const runAttractions = async () => {
    return attractions_1.list().then((results) => {
        return results;
    })
        .catch(e => console.log(e)); // tslint:disable-line no-console
};
const runEntertainment = async () => {
    return entertainment_1.list().then((results) => {
        return results;
    })
        .catch(e => console.log(e)); // tslint:disable-line no-console
};
const runParks = async () => {
    return parks_1.list().then((results) => {
        return results;
    })
        .catch(e => console.log(e)); // tslint:disable-line no-console
};
const runHotels = async () => {
    return hotels_1.list().then((results) => {
        return results;
    })
        .catch(e => console.log(e)); // tslint:disable-line no-console
};
/**
 * A service for retrieving and persisting waitimes.
 */
exports.default = async () => {
    // setup our database connection
    const models = index_1.default();
    // grab our realtime park data
    const parks = await runParks();
    await models.location.addUpdateParks(parks);
    const hotels = await runHotels();
    await models.location.addUpdateHotels(hotels);
    // grab our realtime park data
    const attractions = await runAttractions();
    await models.activity.addUpdateActivities(attractions);
    // TODO: Tours and events
    const entertainment = await runEntertainment();
    await models.activity.addUpdateActivities(entertainment);
};
//# sourceMappingURL=data.js.map