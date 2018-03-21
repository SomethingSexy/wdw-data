"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const attractions_1 = require("./attractions");
const dinning_1 = require("./dinning");
const hours_1 = require("./hours");
exports.attractions = { list: attractions_1.list };
exports.dining = { list: dinning_1.list };
// This is really hours by date, it could go in a calendar export
// or tied to parks, however you might only want to get the calendar
// in subsequent calls
exports.hours = { list: hours_1.list };
// TODO Add park information here
//# sourceMappingURL=index.js.map