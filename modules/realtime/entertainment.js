"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const request_1 = require("./api/request");
const utils_1 = require("./utils");
const path = 'https://disneyworld.disney.go.com/entertainment/';
const ageKeys = ['All Ages', 'Preschoolers', 'Kids', 'Tweens', 'Teens', 'Adults'];
const NO_WHEELCHAIR_TRANSFER = 'May Remain in Wheelchair/ECV';
const ADMISSION_REQUIRED = 'Valid Park Admission Required';
/**
 * Retrieves detailed information about an entertainment activity, internal for processing list.
 * @param {string} url
 */
const get = async (item, logger) => {
    try {
        logger('info', `Getting screen for ${item.url}.`);
        const response = await request_1.screen(item.url);
        logger('info', `Grabbed screen for ${item.url} with length ${response.length}.`);
        const $ = cheerio_1.default(response);
        const $page = $.find('#pageContent');
        const $restrictions = $page
            .find('.moreDetailsInfo .modalContainer .moreDetailsModal-accessibility');
        const wheelchairTransfer = $restrictions
            .find('.moreDetailsModalItem-wheelchair-access')
            .text()
            .trim() !== NO_WHEELCHAIR_TRANSFER;
        const admissionRequired = $page.find('.themeParkAdmission').text().trim() === ADMISSION_REQUIRED;
        const description = $page.find('.finderDetailsPageSubtitle').text().trim();
        // <li class="moreDetailsModalItem-audio-description">Audio Description</li>
        // <li class="moreDetailsModalItem-sign-language">Sign Language</li>
        // <li class="moreDetailsModalItem-handheld-captioning">Handheld Captioning</li>
        // <li class="moreDetailsModalItem-assistive-listening">Assistive Listening</li>
        // TODO: add length if it exists
        return {
            admissionRequired,
            description,
            wheelchairTransfer
        };
    }
    catch (error) {
        logger('error', `Failed to get screen or process screen for ${item.url} - ${error}`);
    }
    return null;
};
/**
 * Retrieves all entertainment locations.
 */
exports.list = async (logger, options = {}) => {
    logger('info', `Grabbing screen for ${path}.`);
    const response = await request_1.screen(path);
    const $ = cheerio_1.default(response);
    const $attractionCards = $.find('li.card');
    logger('info', `Total of ${$attractionCards.length} entertainment to process.`);
    const items = [];
    for (let i = 0; i < (options.max || $attractionCards.length); i += 1) {
        const card = $attractionCards.get(i);
        let location = null;
        let area = null;
        let type;
        let extId;
        let extRefName;
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
        const $description = $card.find('.descriptionLines');
        const $facets = $description.find('.facets');
        const facets = $facets
            .first()
            .text()
            .split(',')
            .filter(detail => detail !== '')
            .map(detail => detail.trim()) || [];
        const ages = [];
        const tags = [];
        facets.forEach(detail => {
            if (ageKeys.includes(detail)) {
                ages.push(detail);
            }
            else {
                tags.push(detail);
            }
        });
        items.push({
            ages,
            area,
            extId,
            extRefName,
            location,
            name,
            tags,
            type,
            url
        });
    }
    logger('info', `Retrieving additional data of ${items.length}.`);
    // We are getting a lot of data here, so lets play nice with them and call them
    // one at a time instead of blasting the server
    const modifiedItems = [];
    for (const item of items) {
        const diningItem = await get(item, logger);
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
 * Retrieves the schedules for all of the entertainment for a given day.  Returns them
 * by activity extId.
 *
 * @param start
 * @param end
 */
exports.schedule = async (start) => {
    const data = {
        date: start,
        filters: 'Entertainment',
        region: 'US',
        scheduleOnly: true
    };
    const auth = await request_1.getAccessToken();
    const response = await request_1.getWebApi('https://disneyworld.disney.go.com/entertainment/', 'entertainment', data, auth);
    const activitySchedules = response.results.reduce((filtered, activity) => {
        if (!activity.schedule) {
            return filtered;
        }
        return [
            ...filtered,
            {
                id: activity.id,
                schedule: {
                    [start]: activity.schedule.schedules.map(s => ({
                        closing: s.endTime,
                        isSpecialHours: false,
                        opening: s.startTime,
                        type: s.type
                    }))
                }
            }
        ];
    }, []);
    return activitySchedules;
};
//# sourceMappingURL=entertainment.js.map