"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./api/request");
const screen_1 = require("./api/screen");
const path = 'https://disneyworld.disney.go.com/attractions/';
const NO_SERVICE_ANIMALS_ID = '16983973';
const MUST_TRANSFER_WHEELCHAIR = '16669963';
// const ages = {
//   ALL_AGES: '16669938'
// };
const facetHasId = (facet, id) => facet && Array.isArray(facet) && !!facet.find(check => check.id === id);
/**
 * Retreives information about all attractions.
 */
exports.list = async () => {
    const screen = await screen_1.grab(path);
    const attractions = await screen.getItems();
    return Promise.all(attractions.map(async (attraction) => exports.get(attraction)));
};
/**
 * Retrieves additional details about an attraction.
 * @param {object} attraction
 */
exports.get = async (attraction) => {
    const url = `/global-pool-override-A/facility-service/attractions/${attraction.extId}`;
    const auth = await request_1.getAccessToken();
    const response = await request_1.get(url, {}, auth);
    let coordinates;
    if (response.coordinates && response.coordinates['Guest Entrance']) {
        coordinates = response.coordinates['Guest Entrance'];
    }
    // console.log(response);
    const { admissionRequired, facets } = response;
    const allowServiceAnimals = !facetHasId(facets.serviceAnimals, NO_SERVICE_ANIMALS_ID);
    const wheelchairTransfer = facetHasId(facets.mobilityDisabilities, MUST_TRANSFER_WHEELCHAIR);
    // TODO: figure out if there are multiple
    const age = facets.age && facets.age[0].value;
    const height = facets.height && facets.height[0].value;
    const thrillFactor = facets.thrillFactor && facets.thrillFactor.map(thrill => thrill.value);
    return Object.assign({}, attraction, { coordinates,
        thrillFactor, description: response.descriptions.shortDescriptionMobile.text, 
        // disneyOperated: response.disneyOperated,
        // disneyOwned: response.disneyOwned,
        extId: response.id, extRefName: response.urlFriendlyId, fastPassPlus: response.fastPassPlus, fastPass: response.fastPass, name: response.name, links: {
            schedule: response.links.schedule,
            waitTimes: response.links.waitTimes
        }, restrictions: {
            admissionRequired,
            age,
            allowServiceAnimals,
            height,
            wheelchairTransfer
        }, riderSwapAvailable: response.riderSwapAvailable });
};
//# sourceMappingURL=attractions.js.map