"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const utils_1 = require("../utils");
const Activity_1 = require("./Activity");
/**
 * Validates a single dining.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateRestaurant = (item) => {
    if (!item.type) {
        return 'Type is required for restaurant.';
    }
    if (!item.extId) {
        return 'ExtId is required for restaurant.';
    }
    return true;
};
/**
 * Validates all dining.
 * @param items
 */
exports.validateRestaurants = (items) => {
    if (!items || !items.length) {
        return 'Restaurants are required to add or update.';
    }
    const errors = items
        .map(validateRestaurant)
        .filter(error => typeof error === 'string');
    return errors.length ? errors : true;
};
class Restaurants {
    constructor(sequelize, access, logger, models) {
        this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.models = models;
    }
    /**
     * Bulk upsert restaurants.
     * @param items
     */
    async bulkAddUpdate(items = []) {
        // if there are no items, just return an empty array
        const valid = exports.validateRestaurants(items);
        if (valid !== true) {
            // if it not valid, return the known errors
            return { [utils_1.Error]: valid };
        }
        this.logger('debug', `Adding and updating ${items.length} restaurants.`);
        const restaurants = await utils_1.syncTransaction(this.sequelize, items, async (item, transaction) => {
            const restaurant = this.createRestaurant(item.id || item.extId);
            const id = await restaurant.upsert(item, transaction);
            return id;
        });
        this.logger('debug', `Finished adding and updating ${restaurants.length} of ${items.length}.`);
        return { [utils_1.Success]: restaurants };
    }
    /**
     * Factory for creating a restaurant model.
     * @param item
     */
    createRestaurant(id) {
        invariant_1.default(id, 'Id is required to create an restaurant.');
        const { Restaurant } = this.models;
        return new Restaurant(this.sequelize, this.dao, this.logger, this.models, id);
    }
    /**
     * Retrieves an restaurant.
     * @param id
     * @returns - Returns an Restaurant model with the data loaded or null if not found
     */
    async findById(id) {
        const restaurant = this.createRestaurant(id);
        const loaded = await restaurant.load();
        if (!loaded) {
            return null;
        }
        return restaurant;
    }
    /**
     * List all restaurants
     * @param where - search parameters
     */
    async findAll(where) {
        const { Age, Dining, Tag, ThrillFactor } = this.dao;
        let query = {
            attributes: Activity_1.RAW_ACTIVITY_ATTRIBUTES,
            include: [{
                    as: 'ActivityAges',
                    attributes: ['name'],
                    model: Age
                }, {
                    as: 'ActivityTags',
                    attributes: ['name'],
                    model: Tag
                }, {
                    as: 'ThrillFactors',
                    attributes: ['name'],
                    model: ThrillFactor
                }]
        };
        if (where) {
            invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for restaurants.');
            query = Object.assign({}, query, { where });
        }
        const found = await Dining.findAll(query);
        // create new shop objects then parse the data
        return found.map(item => this.createRestaurant(item));
    }
    /**
     * Returns a list of raw restaurants.
     *
     * @param where - search parameters
     */
    async list(where) {
        const found = await this.findAll(where);
        return found.map(item => item.data);
    }
}
exports.default = Restaurants;
//# sourceMappingURL=Restaurants.js.map