"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const utils_1 = require("../utils");
const Location_1 = require("./Location");
/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateLocation = (item) => {
    if (!item.type) {
        return 'Type is required for location';
    }
    if (!item.extId) {
        return 'ExtId is required for location.';
    }
    return true;
};
/**
 * Validates all locations.
 * @param items
 */
exports.validateLocations = (items) => {
    if (!items || !items.length) {
        return 'Locations are required to add or update.';
    }
    const errors = items
        .map(validateLocation)
        .filter(error => typeof error === 'string');
    return errors.length ? errors : true;
};
class Locations {
    constructor(sequelize, access, logger, models) {
        this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.models = models;
    }
    /**
     * Upserts locations.  Returns an errors object if known errors are found,
     * otherwise will throw an exception for everything else.
     * @param items
     */
    async bulkAddUpdate(items = []) {
        // if there are no items, just return an empty array
        const valid = exports.validateLocations(items);
        if (valid !== true) {
            // if it not valid, return the known errors
            return { [utils_1.Error]: valid };
        }
        this.logger('debug', `Adding and updating ${items.length} locations.`);
        const locations = await utils_1.syncTransaction(this.sequelize, items, async (item, transaction) => {
            // create a model for this shop,
            const location = this.createLocation(item.id || item.extId);
            // update it with the latest coming in
            await location.upsert(item, transaction);
            // then retrieve the data
            return location.data;
        });
        this.logger('debug', `Finished adding and updating ${locations.length} of ${items.length}.`);
        return { [utils_1.Success]: locations };
    }
    /**
     * Factory for creating a location model.
     * @param item
     */
    createLocation(id) {
        invariant_1.default(id, 'Id is required to create a shop.');
        // TODO: figure out why I need any here
        const Location = this.models.Location;
        return new Location(this.sequelize, this.dao, this.logger, this.models, id);
    }
    /**
     * Searches for a location instance by name
     * @param name
     * @param transaction
     */
    async findByName(name, transaction) {
        // find the instance of the model
        const instance = await this.dao.Location.findOne({
            attributes: ['id', 'type'],
            where: { name }
        }, { transaction });
        if (!instance) {
            return null;
        }
        return this.createLocation(instance);
    }
    /**
     * Returns a list of location models.
     *
     * @param where - search parameters
     */
    async findAll(where) {
        const { Address, Area, Location } = this.dao;
        let query = {
            attributes: Location_1.RAW_LOCATION_ATTRIBUTES,
            include: [{
                    as: 'address',
                    attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
                    model: Address
                }, {
                    as: 'areas',
                    attributes: ['name'],
                    model: Area
                }]
        };
        if (where) {
            invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for locations.');
            query = Object.assign({}, query, { where });
        }
        const found = await Location.findAll(query);
        // create new locations objects then parse the data
        return found.map(item => this.createLocation(item));
    }
    /**
     * Returns a list of raw locations.
     *
     * @param where - search parameters
     */
    async list(where) {
        const found = await this.findAll(where);
        return found.map(item => item.data);
    }
}
exports.default = Locations;
//# sourceMappingURL=Locations.js.map