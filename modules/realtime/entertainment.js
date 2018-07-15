"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const screen_1 = require("./api/screen");
const path = 'https://disneyworld.disney.go.com/entertainment/';
/**
 * Reloads cached data.
 */
exports.list = async () => {
    const screen = await screen_1.grab(path);
    return screen.getItems($item => {
        const $description = $item.find('.descriptionLines');
        const $facets = $description.find('.facets');
        const details = $facets
            .first()
            .text()
            .split(',')
            .filter(detail => detail !== '')
            .map(detail => detail.trim());
        // TODO: Grab schedule from api, there is a separate call for this, doesn't exist on the
        // initial rendering of the screen.
        return { details };
    });
};
//# sourceMappingURL=entertainment.js.map