"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./api/request");
const screen_1 = require("./api/screen");
const path = 'https://disneyworld.disney.go.com/destinations/';
exports.list = async () => {
    const screen = await screen_1.grab(path);
    return screen.getItems();
};
const destinationId = 80007798;
// TODO: Move this to parks instead
exports.waitTimes = async (attraction) => {
    const url = `/facility-service/theme-parks/${80007944};destination=${destinationId}/wait-times`;
    const auth = await request_1.getAccessToken();
    const response = await request_1.get(url, {}, auth);
    response.entries.forEach(element => {
        console.log(element);
    });
};
//# sourceMappingURL=parks.js.map