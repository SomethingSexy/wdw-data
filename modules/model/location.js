"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const data = __importStar(require("../data/locations.json"));
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