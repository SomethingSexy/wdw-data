"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
const index_1 = __importDefault(require("./dao/index"));
const activity_1 = __importDefault(require("./model/activity"));
const dining_1 = __importDefault(require("./model/dining"));
const location_1 = __importDefault(require("./model/location"));
const shop_1 = __importDefault(require("./model/shop"));
const utils_1 = require("./utils");
exports.responseHandlers = { Error: utils_1.Error, Success: utils_1.Success };
/**
 * Setups database connection, creates data access layer, and setups models for
 * working with the data.
 */
exports.default = async (connection, logger) => {
    // create our connection
    const sequelize = connection
        || new sequelize_1.default({
            database: 'wdw',
            dialect: 'postgres',
            pool: {
                max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
            },
            username: 'tylercvetan',
        });
    // get our data access objects
    const accessObjects = index_1.default(sequelize);
    // Sync with the database
    await sequelize.sync();
    // setup models, these will be higher level objects that will handle the business logic
    // around the data access objects
    const activity = activity_1.default(sequelize, accessObjects, logger);
    const dining = dining_1.default(sequelize, accessObjects, logger);
    const location = location_1.default(sequelize, accessObjects, logger);
    const shop = shop_1.default(sequelize, accessObjects, logger);
    return {
        activity,
        dining,
        location,
        shop
    };
};
//# sourceMappingURL=index.js.map