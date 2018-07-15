"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dining_1 = __importDefault(require("./model/dining"));
const dining_2 = require("./realtime/dining");
exports.list = async () => {
    const dinning = [];
    return dinning;
};
exports.reservation = async (id, date, time, size) => {
    const dining = await dining_1.default.get(id);
    return dining_2.reservations({ id: dining.extId, url: dining.url }, date, time, size);
};
//# sourceMappingURL=dining.js.map