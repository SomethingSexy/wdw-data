"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data = require("../data/places.json");
const places = data;
exports.default = {
    get(id) {
        return places.find(place => place.id === id);
    },
    getAll() {
        return places;
    }
};
//# sourceMappingURL=place.js.map