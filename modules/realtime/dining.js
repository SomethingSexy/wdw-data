"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const debug_1 = __importDefault(require("debug"));
const invariant_1 = __importDefault(require("invariant"));
const request_1 = require("./api/request");
const utils_1 = require("./utils");
const debug = debug_1.default('dining');
const VALID_ADMISSION_REQUIRED = 'Valid Park Admission Required';
const CUISINE_LABEL = 'Cuisine';
const QUICK_SERVICE = 'Quick Service';
const DINING_EVENT = 'Dining Event';
const TABLE_SERVICE = 'Table Service';
const path = 'https://disneyworld.disney.go.com/dining/';
exports.get = async (extId, url, logger) => {
    if (!url) {
        // if it doesn't have a url, don't bother getting anything for now other than super basics
        logger('info', `No url for dining ${extId}, cannot get details.`);
        return null;
    }
    logger('info', `Getting screen for ${url}.`);
    try {
        const response = await request_1.screen(url);
        logger('info', `Grabbed screen for ${url} with length ${response.length}.`);
        const $ = cheerio_1.default(response);
        const $rightBarInfo = $.find('.atAGlance');
        const rawCostDescription = $rightBarInfo.find('.diningPriceInfo h3').text();
        const costDescription = rawCostDescription
            .substring(0, rawCostDescription.indexOf(')') + 1)
            .trim();
        const rawAdmissionRequired = $rightBarInfo.find('.themeParkAdmission').text().trim();
        const admissionRequired = rawAdmissionRequired === VALID_ADMISSION_REQUIRED;
        const rawCuisine = $rightBarInfo.find('.diningInfo h3').text().trim();
        let cuisine = null;
        if (rawCuisine) {
            cuisine = rawCuisine
                .split(',')
                .map(text => text.replace(CUISINE_LABEL, '').trim());
        }
        const rawTags = $rightBarInfo.find('.diningInfo p').text().trim();
        let tags = null;
        if (rawTags) {
            tags = rawTags
                .split(',')
                .map(text => text.trim());
        }
        // main contents
        // const $mainContent = $.find('.finderDetailsHeaderContent');
        const rawDescription = $.find('.finderDetailsPageSubtitle').text().trim();
        const description = rawDescription || null;
        // TODO: Hours (only if not in park?), menu, handle things like seminars
        logger('info', `Finished processing data for ${url}.`);
        return {
            admissionRequired,
            costDescription,
            cuisine,
            description,
            tags
        };
    }
    catch (error) {
        logger('error', `Failed to get screen or process screen for ${url} - ${error}`);
    }
    return null;
};
/**
 * Return a list of all dining options.
 */
exports.list = async (logger, options = {}) => {
    logger('info', `Grabbing screen for ${path}.`);
    const response = await request_1.screen(path);
    const $ = cheerio_1.default(response);
    const $diningCards = $.find('li.card');
    logger('info', `Total of ${$diningCards.length} to process.`);
    const items = [];
    for (let i = 0; i < (options.max || $diningCards.length); i += 1) {
        const card = $diningCards.get(i);
        let location = null;
        let area = null;
        let type;
        let extId;
        let extRefName;
        let quickService = false;
        let tableService = false;
        let diningEvent = false;
        const $card = cheerio_1.default(card);
        const external = $card.attr('data-entityid');
        const name = $card.find('.cardName').text();
        const parsedExternal = utils_1.parseExternal(external);
        if (parsedExternal) {
            extId = parsedExternal.extId;
            type = parsedExternal.type;
        }
        if (!type) {
            return undefined;
        }
        const url = $card
            .find('.cardLinkOverlay')
            .attr('href');
        // not every place has a url, for example the California Grill Lounge
        if (url) {
            extRefName = url.substring(path.length, url.length);
            // depending on the url, might be additonal segements we need to remove
            extRefName = extRefName.substring(extRefName.indexOf('/') === extRefName.length - 1 ? 0 : extRefName.indexOf('/') + 1, extRefName.length - 1);
        }
        const fullLocation = utils_1.parseLocation($card.find('span[aria-label=location]').text());
        if (fullLocation) {
            location = fullLocation.location;
            area = fullLocation.area;
        }
        const rawTypes = $card.find('.itemInfo').find('.metaInfo').find('.serviceType').text().trim();
        if (rawTypes) {
            const types = rawTypes.split(',').map(t => t.trim());
            quickService = types.includes(QUICK_SERVICE);
            tableService = types.includes(TABLE_SERVICE);
            diningEvent = types.includes(DINING_EVENT);
        }
        items.push({
            area,
            diningEvent,
            extId,
            extRefName,
            location,
            name,
            quickService,
            tableService,
            type,
            url
        });
    }
    logger('info', `Retrieving additional data of ${items.length}.`);
    // We are getting a lot of data here, so lets play nice with them and call them
    // one at a time instead of blasting the server
    const modifiedItems = [];
    for (const item of items) {
        const diningItem = await exports.get(item.extId, item.url, logger);
        if (typeof diningItem === 'object') {
            modifiedItems.push(Object.assign({}, item, diningItem));
        }
        else {
            modifiedItems.push(item);
        }
    }
    return modifiedItems;
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
    return request_1.diningFinder(dining.url, postData, auth);
};
//# sourceMappingURL=dining.js.map