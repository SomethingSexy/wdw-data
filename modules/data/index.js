"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
const index_1 = __importDefault(require("./dao/index"));
const activity_1 = __importDefault(require("./model/activity"));
const location_1 = __importDefault(require("./model/location"));
/**
 * Setups database connection, creates data access layer, and setups models for
 * working with the data.
 */
exports.default = (connection) => {
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
    sequelize.sync();
    // setup models, these will be higher level objects that will handle the business logic
    // around the data access objects
    const activity = activity_1.default(sequelize, accessObjects);
    const location = location_1.default(sequelize, accessObjects);
    return {
        activity,
        location
    };
};
//# sourceMappingURL=index.js.map