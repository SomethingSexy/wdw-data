"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const data = __importStar(require("../data/parks.json"));
const parks = data.default;
const save = async (json) => {
    return fs_extra_1.writeJSON(path_1.resolve(__dirname, '../data/parks.json'), json);
};
/**
 * Model for retrieving and updating data about attractions
 */
exports.default = {
    /**
     * Add an array of schedules by date.
     * @param id - id of park
     * @param schedule - schedule to add
     */
    async addSchedule(id, schedule) {
        // If there is a current date already, just replace.
        let park = await this.get(id);
        if (!park.hours) {
            park = Object.assign({}, park, { hours: {} });
        }
        park = Object.assign({}, park, { hours: Object.assign({}, park.hours, schedule) });
        return this.update(park);
    },
    async findBy(name, value) {
        return parks.find(place => place[name] === value);
    },
    async findAllBy(name, values = []) {
        // just looping once to find, instead of starting over
        return parks.filter((place) => {
            return values.includes(place[name]);
        });
    },
    async get(id) {
        return parks.find(place => place.id === id);
    },
    async getAll() {
        return parks;
    },
    async update(item) {
        if (!item) {
            return null;
        }
        if (!item.id) {
            throw new Error('Id is required when updating a park.');
        }
        // this is probably slow right now.
        const updated = parks.map(park => {
            if (park.id !== item.id) {
                return park;
            }
            return Object.assign({}, park, item);
        });
        console.log(updated);
        await save(updated);
        return item;
    },
    async updateAll(items = [], ext = false) {
        const key = ext ? 'extId' : 'id';
        const flattened = items
            .reduce((all, item) => {
            return Object.assign({}, all, { [item[key]]: item });
        }, {}); // tslint:disable-line
        // also fucking slow -__-
        const updated = parks.map(park => {
            if (!flattened[park[key]]) {
                return park;
            }
            return Object.assign({}, park, flattened[park[key]], { id: park.id });
        });
        await save(updated);
        return items;
    }
};
//# sourceMappingURL=park.js.map