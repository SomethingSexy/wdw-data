"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const is_uuid_1 = __importDefault(require("is-uuid"));
const lodash_1 = require("lodash");
const utils_1 = require("../utils");
// Note: returning extId for jobs
const RAW_DINING_ATTRIBUTES = [
    'admissionRequired',
    'costDescription',
    'description',
    'diningEvent',
    'extId',
    'id',
    'name',
    'quickService',
    'tableService',
    'type',
    'url',
    'locationId',
    'areaId'
];
const normalizeDining = (dining) => {
    const item = lodash_1.omit(dining, ['DiningCuisines', 'DiningTags']);
    item.cuisine = dining.DiningCuisines.map(cuisine => cuisine.name);
    item.tags = dining.DiningTags.map(tag => tag.name);
    return item;
};
exports.types = {
    ENTERTAINMENT: 'entertainment'
};
/**
 *
 */
class Restaurant {
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
        invariant_1.default(id, 'Internal or external id is required to create an Activity.');
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
    get locations() {
        // TODO: Figure out why I need any here
        const Locations = this.models.Locations;
        return new Locations(this.sequelize, this.dao, this.logger, this.models);
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
        return normalizeDining(raw);
    }
    async upsert(item, transaction) {
        this.logger('debug', `Adding/updating dining ${item.extId}.`);
        const { Cuisine, Dining, Tag } = this.dao;
        const Locations = this.locations;
        const activityItem = {
            admissionRequired: item.admissionRequired,
            costDescription: item.costDescription,
            description: item.description,
            diningEvent: item.diningEvent,
            extId: item.extId,
            extRefName: item.extRefName,
            // only rule so far
            fetchSchedule: item.type === exports.types.ENTERTAINMENT,
            name: item.name,
            quickService: item.quickService,
            tableService: item.tableService,
            type: item.type,
            url: item.url
        };
        if (item.id) {
            activityItem.id = item.id;
        }
        const instance = await utils_1.upsert(Dining, activityItem, { extId: item.extId }, transaction);
        if (item.location) {
            const location = await Locations.findByName(item.location, transaction);
            if (location) {
                await instance.setLocation(location.instance, { transaction });
                if (item.area) {
                    let areaInst = await location.findAreaByName(item.area, transaction);
                    if (!areaInst) {
                        areaInst = await location.addArea(item.area, transaction);
                    }
                    await instance.setArea(areaInst, { transaction });
                }
            }
            else {
                this.logger('error', `Item ${item.name} has location ${item.location} but it cannot be found.`);
            }
        }
        if (item.tags) {
            // either sync or async with Promise.all
            for (const tagName of item.tags) {
                const tagInst = await utils_1.upsert(Tag, { name: tagName, from: 'dining' }, { name: tagName }, transaction);
                if (!await instance.hasDiningTags(tagInst)) {
                    await instance.addDiningTags(tagInst, { transaction });
                }
            }
        }
        if (item.cuisine) {
            // either sync or async with Promise.all
            for (const cuisine of item.cuisine) {
                const cuisineInst = await utils_1.upsert(Cuisine, { name: cuisine }, { name: cuisine }, transaction);
                if (!await instance.hasDiningCuisines(cuisineInst)) {
                    await instance.addDiningCuisines(cuisineInst, { transaction });
                }
            }
        }
        this.logger('debug', `Finished adding/updating dining ${item.extId}.`);
        return instance.get('id');
    }
    async load() {
        const { Dining, Tag, Cuisine } = this.dao;
        // setting to any because I am not gonna repeat sequelize's api
        const queryInclude = [{
                as: 'DiningTags',
                attributes: ['name'],
                model: Tag
            }, {
                as: 'DiningCuisines',
                attributes: ['name'],
                model: Cuisine
            }];
        const query = {
            attributes: RAW_DINING_ATTRIBUTES,
            include: queryInclude,
            where: { [this.idKey]: this.id }
        };
        if (this.instance) {
            await this.instance.reload(query);
        }
        else {
            this.instance = await Dining.findOne(query);
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
exports.default = Restaurant;
//# sourceMappingURL=Restaurant.js.map