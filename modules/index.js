"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const attractions_1 = require("./attractions");
const dining_1 = require("./dining");
const hours_1 = require("./hours");
const index_1 = require("./schema/index");
// TODO: put this someplace else
exports.api = query => {
    return graphql_1.graphql(index_1.default, query);
};
// these should have the same api
// save off external id, but generate our own internal id
exports.attractions = { list: attractions_1.list };
exports.dining = { list: dining_1.list };
// This is really hours by date, it could go in a calendar export
// or tied to parks, however you might only want to get the calendar
// in subsequent calls
exports.hours = { list: hours_1.list };
// TODO output hotels
// TODO output parks
// TODO places = hotels, parks, attractions, dining
// TODO: output a single api to get the data using graphql
// have this project store the data locally (except for park hours)
//# sourceMappingURL=index.js.map