"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
const invariant_1 = __importDefault(require("invariant"));
const request_1 = require("./api/request");
const screen_1 = require("./api/screen");
const debug = debug_1.default('dining');
const path = 'https://disneyworld.disney.go.com/dining/';
exports.list = async () => {
    const screen = await screen_1.grab(path);
    return screen.getItems($item => {
        const costCuisineInfo = $item.find('span[aria-label=facets]').text().split(',');
        const cost = costCuisineInfo.length === 2 ? costCuisineInfo[0].trim() : '';
        const cuisine = costCuisineInfo.length === 2 ? costCuisineInfo[1].trim() : '';
        const description = $item.find('span[aria-label="dining type"]').text();
        // TODO: Hours, reservations, menu
        return {
            cost,
            cuisine,
            description
        };
    });
};
/**
 * Retrieves available reservations for a restaurant.
 *
 * TODO: Add support for multiple.
 *
 */
exports.reservations = async (dining, date, time, size) => {
    invariant_1.default(dining, 'Dining object is required when checking reservations.');
    invariant_1.default(date, 'Date is required when checking reservations.');
    invariant_1.default(time, 'Time is required when checking reservations.');
    invariant_1.default(size, 'Party size is required when checking reservations.');
    debug('Running reservation call');
    let localTime;
    if (time === 'dinner') {
        localTime = '80000714';
    }
    else if (time === 'lunch') {
        localTime = '80000717';
    }
    else if (time === 'breakfast') {
        localTime = '80000712';
    }
    else {
        localTime = time;
    }
    const postData = {
        id: dining.id,
        partySize: size,
        searchDate: date,
        searchTime: localTime,
        skipPricing: true,
        type: 'dining'
    };
    const auth = await request_1.getWebSession(dining.url);
    return request_1.finder(dining.url, postData, auth);
};
//# sourceMappingURL=dining.js.map