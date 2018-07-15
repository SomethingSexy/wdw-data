"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const utils_1 = require("../utils");
const request_1 = require("./request");
exports.grab = async (path) => {
    const response = await request_1.screen(path);
    const $ = cheerio_1.default(response);
    return {
        /**
         * Returns an array of screen cards.
         */
        getItems: async (callback) => {
            const $cards = $.find('li.card');
            let items = [];
            // .each instead of .map because map().get() in Typescript forces string[]
            $cards.each(({}, card) => {
                let location;
                let area;
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
                const fullLocation = utils_1.parseLocation($card.find('span[aria-label=location]').text());
                if (fullLocation) {
                    location = fullLocation.location;
                    area = fullLocation.area;
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
                items.push({
                    $card,
                    item: {
                        area,
                        extId,
                        extRefName,
                        location,
                        name,
                        type,
                        url
                    }
                });
            });
            if (callback) {
                items = await Promise.all(items
                    .map(async (item) => {
                    const additional = await callback(item.$card, item.item);
                    if (additional) {
                        return Object.assign({}, item, { item: Object.assign({}, item.item, additional) });
                    }
                    return item;
                }));
            }
            return items.map(item => item.item);
        },
        html: () => {
            return $;
        }
    };
};
//# sourceMappingURL=screen.js.map