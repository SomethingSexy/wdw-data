"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
const index_1 = __importDefault(require("./data/index"));
/**
 * Creates a database connection and returns models for accessing data.
 * @param connection
 */
exports.createModels = async (connection, logger) => {
    const sequelize = new sequelize_1.default(Object.assign({}, connection, { dialect: 'postgres' }));
    return index_1.default(sequelize, logger);
};
// TODO: Export realtime stuff for hooking up to jobs
//# sourceMappingURL=index.js.map