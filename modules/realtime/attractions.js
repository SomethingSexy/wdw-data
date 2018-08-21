"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const request_1 = require("./api/request");
const utils_1 = require("./utils");
const path = 'https://disneyworld.disney.go.com/attractions/';
const NO_SERVICE_ANIMALS_ID = '16983973';
const MUST_TRANSFER_WHEELCHAIR = '16669963';
// const ages = {
//   ALL_AGES: '16669938'
// };
const facetHasId = (facet, id) => facet && Array.isArray(facet) && !!facet.find(check => check.id === id);
/**
 * Retrieves additional details about an attraction.
 * @param {object} attraction
 */
exports.get = async (attraction, logger) => {
    if (!attraction.extId) {
        logger('info', `No extId for attraction, cannot retrieve additional data.`);
        return null;
    }
    const url = `/global-pool-override-A/facility-service/attractions/${attraction.extId}`;
    logger('info', `Getting request data for ${url}.`);
    const auth = await request_1.getAccessToken();
    const response = await request_1.get(url, {}, auth);
    logger('info', `Grabbed data for ${url}.`);
    let coordinates;
    if (response.coordinates && response.coordinates['Guest Entrance']) {
        coordinates = response.coordinates['Guest Entrance'];
    }
    const { admissionRequired, descriptions, facets } = response;
    const { age, interests } = facets;
    // console.log(facets);
    const allowServiceAnimals = !facetHasId(facets.serviceAnimals, NO_SERVICE_ANIMALS_ID);
    const wheelchairTransfer = facetHasId(facets.mobilityDisabilities, MUST_TRANSFER_WHEELCHAIR);
    const tags = interests && interests.map(interest => interest.value);
    const ages = age && facets.age.map(a => a.value);
    const height = facets.height && facets.height[0].value;
    const thrillFactor = facets.thrillFactor && facets.thrillFactor.map(thrill => thrill.value);
    const description = descriptions.shortDescriptionMobile
        ? descriptions.shortDescriptionMobile.text : '';
    logger('info', `Finished processing data for ${url}.`);
    return Object.assign({}, attraction, { admissionRequired,
        ages,
        allowServiceAnimals,
        coordinates,
        description,
        height,
        tags,
        thrillFactor,
        wheelchairTransfer, 
        // disneyOperated: response.disneyOperated,
        // disneyOwned: response.disneyOwned,
        extId: response.id, extRefName: response.urlFriendlyId, fastPassPlus: response.fastPassPlus, fastPass: response.fastPass, name: response.name, links: {
            schedule: response.links.schedule,
            waitTimes: response.links.waitTimes
        }, riderSwapAvailable: response.riderSwapAvailable });
};
/**
 * Retreives information about all attractions.
 */
exports.list = async (logger, options = {}) => {
    logger('info', `Grabbing screen for ${path}.`);
    const response = await request_1.screen(path);
    const $ = cheerio_1.default(response);
    const $attractionCards = $.find('li.card');
    logger('info', `Total of ${$attractionCards.length} attractions to process.`);
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
        items.push({
            area,
            extId,
            extRefName,
            location,
            name,
            type,
            url
        });
    }
    logger('info', `Retrieving additional data of ${items.length}.`);
    // We are getting a lot of data here, so lets play nice with them and call them
    // one at a time instead of blasting the server
    const modifiedItems = [];
    for (const item of items) {
        const attractionItem = await exports.get(item, logger);
        if (typeof attractionItem === 'object') {
            modifiedItems.push(Object.assign({}, item, attractionItem));
        }
        else {
            modifiedItems.push(item);
        }
    }
    return modifiedItems;
};
//# sourceMappingURL=attractions.js.map