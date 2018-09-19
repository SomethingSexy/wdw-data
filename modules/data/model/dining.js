"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const pick_1 = __importDefault(require("lodash/pick")); // tslint:disable-line
const utils_1 = require("../utils");
const location_1 = __importDefault(require("./location"));
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
const normalizeDining = dining => (Object.assign({}, pick_1.default(dining, RAW_DINING_ATTRIBUTES), { cuisine: dining.DiningCuisines.map(cuisine => cuisine.name), tags: dining.DiningTags.map(tag => tag.name) }));
exports.types = {
    ENTERTAINMENT: 'entertainment'
};
const addUpdateDining = async (item, Location, access, transaction, logger) => {
    logger('debug', `Adding/updating dining ${item.extId}.`);
    const { Cuisine, Dining, Tag } = access;
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
    const diningInst = await utils_1.upsert(Dining, activityItem, { extId: item.extId }, transaction);
    if (item.location) {
        const locationInstance = await Location.findByName(item.location, transaction);
        if (locationInstance) {
            await diningInst.setLocation(locationInstance, { transaction });
        }
        // TODO: else log an issue if we cannot find a location
        // if there is a location, we might also have an area, however
        // we have to add the area here because there is no other way
        // to easily generate them
        if (item.area) {
            const locationId = locationInstance.get('id');
            let areaInst = await Location.findAreaByName(locationId, item.area, transaction);
            if (!areaInst) {
                areaInst = await Location.addArea(locationId, item.area, transaction);
            }
            await diningInst.setArea(areaInst, { transaction });
        }
    }
    if (item.tags) {
        // either sync or async with Promise.all
        for (const tagName of item.tags) {
            const tagInst = await utils_1.upsert(Tag, { name: tagName, from: 'dining' }, { name: tagName }, transaction);
            if (!await diningInst.hasDiningTags(tagInst)) {
                await diningInst.addDiningTags(tagInst, { transaction });
            }
        }
    }
    if (item.cuisine) {
        // either sync or async with Promise.all
        for (const cuisine of item.cuisine) {
            const cuisineInst = await utils_1.upsert(Cuisine, { name: cuisine }, { name: cuisine }, transaction);
            if (!await diningInst.hasDiningCuisines(cuisineInst)) {
                await diningInst.addDiningCuisines(cuisineInst, { transaction });
            }
        }
    }
    logger('debug', `Finished adding/updating dining ${item.extId}.`);
    return diningInst.get('id');
};
/**
 * Validates a single dining.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateDining = (item) => {
    if (!item.type) {
        return 'Type is required for an activity.';
    }
    if (!item.extId) {
        return 'ExtId is required for activity.';
    }
    return true;
};
/**
 * Validates all activities.
 * @param items
 */
exports.validateAllDining = (items) => {
    if (!items || !items.length) {
        return 'Activities are required to add or update.';
    }
    const errors = items
        .map(validateDining)
        .filter(error => typeof error === 'string');
    return errors.length ? errors : true;
};
exports.default = (sequelize, access, logger) => {
    const api = {
        async addUpdate(items = []) {
            const Location = location_1.default(sequelize, access, logger);
            return utils_1.syncTransaction(sequelize, items, async (item, transaction) => {
                const dining = await addUpdateDining(item, Location, access, transaction, logger);
                return api.get(dining);
            });
        },
        /**
         * Returns a raw dining by id.
         * @param id
         */
        async get(id) {
            const { Dining, Tag, Cuisine } = access;
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
            const found = await Dining.findOne({
                attributes: RAW_DINING_ATTRIBUTES,
                include: queryInclude,
                where: { id }
            });
            if (!found) {
                // let the caller handle not found
                return null;
            }
            const raw = found.get({ plain: true });
            return normalizeDining(raw);
        },
        /**
         * List all activities
         * @param where - search parameters
         */
        async list(where) {
            const { Dining, Tag, Cuisine } = access;
            let query = {
                attributes: RAW_DINING_ATTRIBUTES,
                include: [{
                        as: 'DiningTags',
                        attributes: ['name'],
                        model: Tag
                    }, {
                        as: 'DiningCuisines',
                        attributes: ['name'],
                        model: Cuisine
                    }]
            };
            if (where) {
                invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for activities.');
                query = Object.assign({}, query, { where });
            }
            const found = Dining.findAll(query);
            return found.map(item => {
                // need to further normalize
                const raw = item.get({ plain: true });
                return normalizeDining(raw);
            });
        }
    };
    return api;
};
//# sourceMappingURL=dining.js.map