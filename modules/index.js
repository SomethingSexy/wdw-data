"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
const index_1 = __importDefault(require("./data/index"));
const index_2 = require("./realtime/index");
const createLogger = (logger) => (type, message) => {
    if (logger) {
        logger.log(type, message);
    }
};
/**
 * Creates a database connection and returns models for accessing data.
 * @param connection
 */
exports.createModels = async (connection, logger) => {
    const sequelize = new sequelize_1.default(Object.assign({}, connection, { dialect: 'postgres' }));
    return index_1.default(sequelize, createLogger(logger));
};
// TODO: Export realtime stuff for hooking up to jobs
exports.realtime = (logger) => {
    const internalLogger = createLogger(logger);
    return {
        attractions: index_2.attractions(internalLogger),
        dining: index_2.dining(internalLogger),
        entertainment: index_2.entertainment(internalLogger),
        hotels: index_2.hotels(internalLogger),
        parks: index_2.parks(internalLogger)
    };
};
//# sourceMappingURL=index.js.map