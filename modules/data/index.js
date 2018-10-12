"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
const index_1 = __importDefault(require("./dao/index"));
const Activity_1 = __importDefault(require("./model/Activity"));
const Activities_1 = __importDefault(require("./model/Activities"));
const Date_1 = __importDefault(require("./model/Date"));
const dining_1 = __importDefault(require("./model/dining"));
const Location_1 = __importDefault(require("./model/Location"));
const Locations_1 = __importDefault(require("./model/Locations"));
const Shop_1 = __importDefault(require("./model/Shop"));
const Shops_1 = __importDefault(require("./model/Shops"));
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
    // around the data access objects,
    // for now we are creating a single instance here, turn into factory methods if we want
    // to create instances outside of here
    const activity = new Activities_1.default(sequelize, accessObjects, logger, { Activity: Activity_1.default, Date: Date_1.default, Location: Location_1.default, Locations: Locations_1.default });
    const dining = dining_1.default(sequelize, accessObjects, logger);
    const location = new Locations_1.default(sequelize, accessObjects, logger, { Date: Date_1.default, Location: Location_1.default });
    const shop = new Shops_1.default(sequelize, accessObjects, logger, { Location: Location_1.default, Locations: Locations_1.default, Shop: Shop_1.default });
    return {
        activity,
        dining,
        location,
        shop
    };
};
//# sourceMappingURL=index.js.map