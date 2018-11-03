"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const is_uuid_1 = __importDefault(require("is-uuid"));
const pick_1 = __importDefault(require("lodash/pick")); // tslint:disable-line
const types_1 = require("../../types");
const utils_1 = require("../utils");
const RAW_ADDRESS_ATTRIBUTES = [
    'city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'
];
const RAW_AREA_ATTRIBUTES = ['name'];
const RAW_ACTIVITIES_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url'];
exports.THEME_PARK = 'theme-park';
exports.WATER_PARK = 'water-park';
exports.ENTERTAINMENT_TYPE = 'entertainment-venue';
// Note: extId is on here right now for the jobs
exports.RAW_LOCATION_ATTRIBUTES = [
    'id', 'name', 'description', 'type', 'url', 'extId', 'fetchSchedule', 'image'
];
exports.normalizeLocation = (location, counts) => {
    const core = {
        activities: location.activities,
        address: location.Address || null,
        areas: location.areas ? location.areas.map(area => area.name) : [],
        description: location.description,
        extId: location.extId,
        extRefName: location.extRefName,
        fetchSchedule: location.fetchSchedule,
        id: location.id,
        image: location.image,
        name: location.name,
        type: location.type,
        url: location.url
    };
    if (counts) {
        core.activitiesCount = counts.activity;
        core.diningCount = counts.dining;
    }
    return core;
};
class ParkModel {
    /**
     *
     * @param sequelize
     * @param access
     * @param logger
     * @param models
     * @param id - string or location instance to preload
     */
    constructor(sequelize, access, logger, models, id) {
        this.instance = null;
        this._id = '';
        this.isExt = false;
        this.idKey = 'id';
        this.counts = null;
        invariant_1.default(id, 'Internal or external id is required to create a Location.');
        this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.models = models;
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
    static buildQuery(_, dao, { where }) {
        const { Address, Area } = dao;
        let query = {
            attributes: [
                ...exports.RAW_LOCATION_ATTRIBUTES,
            ],
            // group: ['address.id', 'areas.id', 'location.id'],
            include: [{
                    attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
                    model: Address
                }, {
                    attributes: ['name'],
                    model: Area
                },
            ],
            where: {
                type: [exports.THEME_PARK, exports.ENTERTAINMENT_TYPE]
            }
        };
        if (where) {
            invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for locations.');
            query = Object.assign({}, query, { where: Object.assign({}, query.where, where) });
        }
        return query;
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
        return exports.normalizeLocation(raw, this.counts);
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
    async addSchedule(scheduleDate, parkSchedules, transaction) {
        const { LocationSchedule, Schedule } = this.dao;
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        if (!found) {
            this.logger('error', `Location ${this.id} not found when adding a schedule.`);
            return null;
        }
        const { Date } = this.models;
        const dateModel = new Date(this.sequelize, this.dao, this.logger, scheduleDate);
        await dateModel.load(transaction);
        const dateId = dateModel.data.id;
        // Check to see if we have any schedules for this location and date already
        // this might cause issues in the future if we did not update everything,
        // worry about that if it comes up
        const alreadyAdded = await LocationSchedule
            .findOne({ where: { dateId, locationId: this.id } });
        if (alreadyAdded) {
            return null;
        }
        // TODO: This is going to return the instance, we probably don't want that in
        // the long run
        await Promise.all(parkSchedules.map(data => Schedule.create(data, { transaction })))
            .then(scheduleInstances => {
            return Promise.all(scheduleInstances.map(scheduleInstance => 
            // TODO: is this better than putting this function on the model?
            dateModel.instance.addSchedule(scheduleInstance, {
                transaction,
                through: { locationId: this.id } // tslint:disable-line
            })));
        });
        return { [utils_1.Success]: true };
    }
    async bulkAddSchedules(parkSchedules) {
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        // if we are trying to find schedules for a location that doesn't exist
        // throw an exception here.
        if (!found) {
            this.logger('error', `Location ${this.id} not found when adding schedules.`);
            return null;
        }
        if (!this.instance.get('fetchSchedule')) {
            this.logger('error', `Location ${this.id} does not support schedules.`);
            return null;
        }
        this.logger('debug', `park schedule ${JSON.stringify(parkSchedules, null, 4)}`);
        await Promise.all(Object
            .entries(parkSchedules)
            .map(([key, value]) => {
            return this.sequelize.transaction(t => {
                this.logger('debug', `${key}, ${value}`);
                return this.addSchedule(key, value, t);
            });
        })
            .filter(schedule => schedule !== null));
        // TODO: Figure out what to return from here, probably call get location schedule
        return { [utils_1.Success]: true };
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
    async load(include) {
        const { Activity, Address, Area, Dining, Location } = this.dao;
        const queryInclude = [{
                attributes: RAW_ADDRESS_ATTRIBUTES,
                model: Address
            }, {
                attributes: RAW_AREA_ATTRIBUTES,
                model: Area
            }];
        // check to see if we are including different associations
        if (include) {
            include.forEach(i => {
                if (i === types_1.GetTypes.Activities) {
                    queryInclude.push({
                        attributes: RAW_ACTIVITIES_ATTRIBUTES,
                        include: [{
                                attributes: ['name'],
                                model: Area
                            }],
                        model: Activity
                    });
                }
            });
        }
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
        // We need to handle counts separately, there is currently a bug with sequelize
        // where you cannot make multiple counts in a single fetch
        const activityCount = await Activity.count({ where: { locationId: this.id } });
        const diningCount = await Dining.count({ where: { locationId: this.id } });
        this.counts = { activity: activityCount, dining: diningCount };
        return true;
    }
    /**
     * Retrieves schedules for a given day.
     * @param id
     * @param date
     * @returns - Array of schedules for the given day.  Returns null if the location cannot b
     *            found or an empty array if no schedules are found.
     */
    async getSchedule(byDate) {
        // First lets verify that this location exists
        const { Date, LocationSchedule, Schedule } = this.dao;
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        // if we are trying to find schedules for a location that doesn't exist
        // throw an exception here.
        if (!found) {
            this.logger('error', `Location ${this.id} not found when searching for schedules.`);
            return null;
        }
        // Grab the date instance, if there is no date, that means we do not
        // have any schedules for this location.
        const dateInst = await Date.findOne({ where: { date: byDate } });
        if (!dateInst) {
            this.logger('debug', `No date for ${byDate} when searching for schedules for location ${this.id}`);
            return [];
        }
        // I am sure there is a better way to do this
        const schedules = await LocationSchedule.findAll({
            include: [{
                    model: Schedule
                }, {
                    model: Date
                }],
            where: { dateId: dateInst.get('id'), locationId: this.instance.get('id') },
        });
        return schedules.map(item => {
            const raw = item.get({ plain: true });
            return Object.assign({}, pick_1.default(raw.schedule, ['closing', 'opening', 'isSpecialHours', 'type']), pick_1.default(raw.date, ['date', 'holiday', 'isHoliday']));
        });
    }
    async upsert(item, transaction) {
        const { Address, Location } = this.dao;
        this.logger('debug', `Adding/updating location ${this.id}.`);
        const data = Object.assign({}, item, { fetchSchedule: item.type === exports.THEME_PARK || item.type === exports.WATER_PARK });
        const locationInstance = await utils_1.upsert(Location, data, { [this.idKey]: this.id }, transaction, item.address ? [Address] : null);
        this.logger('debug', `Finished adding/updating location ${this.id}.`);
        // set the instance after we created,
        // TODO: Should we call update on existing instance if we already have it?
        this.instance = locationInstance;
        return locationInstance.get('id');
    }
}
exports.default = ParkModel;
//# sourceMappingURL=Park.js.map