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
const data = __importStar(require("../data/dining.json"));
const dining = data.default;
const save = async (json) => {
    return fs_extra_1.writeJSON(path_1.resolve(__dirname, '../data/dining.json'), json);
};
/**
 * Model for retrieving persisted information about dining.
 */
exports.default = {
    async findBy(name, value) {
        return dining.find(place => place[name] === value);
    },
    async findAllBy(name, values = []) {
        // just looping once to find, instead of starting over
        return dining.filter((place) => {
            return values.includes(place[name]);
        });
    },
    async get(id) {
        return dining.find(place => place.id === id);
    },
    async getAll() {
        return dining;
    },
    async update(item) {
        if (!item) {
            return null;
        }
        if (!item.id) {
            throw new Error('Id is required when updating dining.');
        }
        // this is probably slow right now.
        const updated = dining.map(diner => {
            if (diner.id !== item.id) {
                return diner;
            }
            return Object.assign({}, diner, item);
        });
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
        const updated = dining.map(diner => {
            if (!flattened[diner[key]]) {
                return diner;
            }
            return Object.assign({}, diner, flattened[diner[key]], { id: diner.id });
        });
        await save(updated);
        return items;
    }
};
//# sourceMappingURL=dining.js.map