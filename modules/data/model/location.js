"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const is_uuid_1 = __importDefault(require("is-uuid"));
// Note: extId is on here right now for the jobs
exports.RAW_LOCATION_ATTRIBUTES = [
    'id', 'name', 'description', 'type', 'url', 'extId', 'fetchSchedule'
];
var GetTypes;
(function (GetTypes) {
    GetTypes["Activities"] = "activities";
})(GetTypes = exports.GetTypes || (exports.GetTypes = {}));
exports.normalizeLocation = (location) => {
    const core = {
        description: location.description,
        extId: location.extId,
        extRefName: location.extRefName,
        fetchSchedule: location.fetchSchedule,
        id: location.id,
        name: location.name,
        type: location.type,
        url: location.url
    };
    return core;
};
class LocationModel {
    /**
     *
     * @param sequelize
     * @param access
     * @param logger
     * @param models
     * @param id - string or location instance to preload
     */
    constructor({}, access, logger, {}, id) {
        this.instance = null;
        this._id = '';
        this.isExt = false;
        this.idKey = 'id';
        invariant_1.default(id, 'Internal or external id is required to create a Location.');
        this.dao = access;
        this.logger = logger;
        if (typeof id === 'string') {
            this.id = id;
            this.isExt = !is_uuid_1.default.v4(id);
            this.idKey = this.isExt ? 'extId' : 'id';
            this.instance = null;
        }
        else {
            // we are assuming instance for now
            this.instance = id;
            this.id = this.instance.get('id');
        }
    }
    set id(id) {
        this._id = id;
        this.isExt = !is_uuid_1.default.v4(id);
        this.idKey = this.isExt ? 'extId' : 'id';
    }
    get id() {
        return this._id;
    }
    get data() {
        // if no instance, throw an error
        invariant_1.default(this.instance, 'An instance is required to retrieve data, call load first.');
        const raw = this.instance.get({ plain: true });
        return exports.normalizeLocation(raw);
    }
    /**
     * Adds area and returns the instance for now.
     * @param name
     * @param transaction
     */
    async addArea(name, transaction) {
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        if (!found) {
            this.logger('error', `Location ${this.id} not found when trying to find an area.`);
            return null;
        }
        const { Area } = this.dao;
        const locationId = this.instance.get('id');
        // location and name should be unique combination
        const exist = await Area.findOne({ where: { locationId, name } }, { transaction });
        if (exist) {
            return exist;
        }
        return Area.create({ locationId, name }, { transaction });
    }
    bulkAddSchedules(_) {
        throw new Error('bulkAddSchedules is not implemented for locations.');
    }
    /**
     * Searches for an area instance.
     * @param name
     * @param transaction
     */
    async findAreaByName(name, transaction) {
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        if (!found) {
            this.logger('error', `Location ${this.id} not found when trying to find an area.`);
            return null;
        }
        const { Area } = this.dao;
        const locationId = this.instance.get('id');
        // TODO; Return model
        return Area.findOne({ where: { locationId, name } }, { transaction });
    }
    /**
     * Returns a raw location by id.
     * @param id
     */
    async load() {
        const { Location } = this.dao;
        const queryInclude = [];
        const query = {
            attributes: exports.RAW_LOCATION_ATTRIBUTES,
            include: queryInclude,
            where: { [this.idKey]: this.id }
        };
        if (this.instance) {
            await this.instance.reload(query);
        }
        else {
            this.instance = await Location.findOne(query);
        }
        if (!this.instance) {
            // let the caller handle not found
            this.instance = null;
            return false;
        }
        // lets reset the id to the internal one
        this.id = this.instance.get('id');
        return true;
    }
}
exports.default = LocationModel;
//# sourceMappingURL=Location.js.map