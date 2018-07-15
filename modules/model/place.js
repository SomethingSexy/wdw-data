"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const data = __importStar(require("../data/places.json"));
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