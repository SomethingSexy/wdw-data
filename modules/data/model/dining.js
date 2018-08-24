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
const RAW_ACTIVITY_ATTRIBUTES = [
    'admissionRequired',
    'allowServiceAnimals',
    'description',
    'extId',
    'fastPass',
    'fastPassPlus',
    'height',
    'id',
    'name',
    'riderSwapAvailable',
    'type',
    'url',
    'wheelchairTransfer',
    'locationId',
    'areaId'
];
const normalizeActivity = activity => (Object.assign({}, pick_1.default(activity, RAW_ACTIVITY_ATTRIBUTES), { ages: activity.ActivityAges.map(age => age.name), tags: activity.ActivityTags.map(tag => tag.name), thrills: activity.ThrillFactors.map(factor => factor.name) }));
exports.types = {
    ENTERTAINMENT: 'entertainment'
};
exports.default = (sequelize, access, logger) => {
    const api = {
        async addUpdate(items = []) {
            const { Cuisine, Dining, Tag } = access;
            const Location = location_1.default(sequelize, access, logger);
            return utils_1.syncTransaction(sequelize, items, async (item, t) => {
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
                const diningInst = await utils_1.upsert(Dining, activityItem, { extId: item.extId }, t);
                if (item.location) {
                    const locationInstance = await Location.findByName(item.location, t);
                    if (locationInstance) {
                        await diningInst.setLocation(locationInstance, { transaction: t });
                    }
                    // TODO: else log an issue if we cannot find a location
                    // if there is a location, we might also have an area, however
                    // we have to add the area here because there is no other way
                    // to easily generate them
                    if (item.area) {
                        const locationId = locationInstance.get('id');
                        let areaInst = await Location.findAreaByName(locationId, item.area, t);
                        if (!areaInst) {
                            areaInst = await Location.addArea(locationId, item.area, t);
                        }
                        await diningInst.setArea(areaInst, { transaction: t });
                    }
                }
                if (item.tags) {
                    // either sync or async with Promise.all
                    for (const tagName of item.tags) {
                        const tagInst = await utils_1.upsert(Tag, { name: tagName, from: 'dining' }, { name: tagName }, t);
                        if (!await diningInst.hasDiningTags(tagInst)) {
                            await diningInst.addDiningTags(tagInst, { transaction: t });
                        }
                    }
                }
                if (item.cuisine) {
                    for (const cuisine of item.cuisine) {
                        await utils_1.upsert(Cuisine, { name: cuisine, diningId: diningInst.get('id') }, { name: cuisine }, t);
                    }
                }
                return diningInst;
            });
        },
        /**
         * Returns a raw activity by id.
         * @param id
         */
        async get(id) {
            const { Activity, Age, Tag, ThrillFactor } = access;
            // setting to any because I am not gonna repeat sequelize's api
            const queryInclude = [{
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
                }];
            const activity = await sequelize.transaction(async (transaction) => {
                const found = await Activity.findOne({
                    attributes: RAW_ACTIVITY_ATTRIBUTES,
                    include: queryInclude,
                    where: { id }
                }, { transaction });
                if (!found) {
                    // let the caller handle not found
                    return null;
                }
                const raw = found.get({ plain: true });
                return normalizeActivity(raw);
            });
            return activity;
        },
        /**
         * List all activities
         * @param where - search parameters
         */
        async list(where) {
            const { Activity, Age, Tag, ThrillFactor } = access;
            let query = {
                attributes: RAW_ACTIVITY_ATTRIBUTES,
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
                invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for activities.');
                query = Object.assign({}, query, { where });
            }
            const found = Activity.findAll(query);
            return found.map(item => {
                // need to further normalize
                const raw = item.get({ plain: true });
                return normalizeActivity(raw);
            });
        }
    };
    return api;
};
//# sourceMappingURL=dining.js.map