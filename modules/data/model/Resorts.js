"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const utils_1 = require("../utils");
const RESORT_TYPE = 'resort';
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
class Resorts {
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
            const location = this.create(item.id || item.extId);
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
    create(id) {
        invariant_1.default(id, 'Id is required to create a shop.');
        // TODO: figure out why I need any here
        const Resort = this.models.Resort;
        return new Resort(this.sequelize, this.dao, this.logger, this.models, id);
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
            where: { name, type: RESORT_TYPE }
        }, { transaction });
        if (!instance) {
            return null;
        }
        return this.create(instance);
    }
    /**
     * Searches for a location instance by id
     * @param name
     * @param transaction
     */
    async findById(id, include) {
        const location = this.create(id);
        const found = await location.load(include);
        if (!found) {
            return null;
        }
        return location;
    }
    /**
     * Returns a list of location models.
     *
     * @param where - search parameters
     */
    async findAll(where) {
        const { Hotel } = this.dao;
        let query = {
            attributes: ['id']
        };
        if (where) {
            query = Object.assign({}, query, { where: Object.assign({}, where) });
        }
        // There is additional data we might need to fetch per location that we
        // cannot easily fetch in a single request.  So just offload it to the model
        const found = await Hotel.findAll(query);
        return Promise.all(found.map(async (item) => {
            const model = this.create(item.get('id'));
            await model.load();
            return model;
        }));
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
exports.default = Resorts;
//# sourceMappingURL=Resorts.js.map