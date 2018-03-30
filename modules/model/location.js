"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data = require("../data/locations.json");
const locations = data;
exports.default = {
    get(id) {
        return locations.find(place => place.id === id);
    },
    getAll() {
        return locations;
    }
};
//# sourceMappingURL=location.js.map