"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const PARK_TYPE = 'theme-park';
const ENTERTAINMENT_TYPE = 'entertainment-venue';
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
     * Factory for creating a location model.
     * @param item
     */
    create(id) {
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
            where: { name, type: [PARK_TYPE, ENTERTAINMENT_TYPE] }
        }, { transaction });
        if (!instance) {
            return null;
        }
        return this.create(instance);
    }
}
exports.default = Locations;
//# sourceMappingURL=Locations.js.map