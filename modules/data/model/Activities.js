"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const utils_1 = require("../utils");
const Activity_1 = require("./Activity");
/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateActivity = (item) => {
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
const validateActivities = (items) => {
    if (!items || !items.length) {
        return 'Activities are required to add or update.';
    }
    const errors = items
        .map(validateActivity)
        .filter(error => typeof error === 'string');
    return errors.length ? errors : true;
};
class Activities {
    constructor(sequelize, access, logger, models) {
        this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.models = models;
    }
    /**
     * Bulk upsert activities.
     * @param items
     */
    async bulkAddUpdate(items = []) {
        // if there are no items, just return an empty array
        const valid = validateActivities(items);
        if (valid !== true) {
            // if it not valid, return the known errors
            return { [utils_1.Error]: valid };
        }
        this.logger('debug', `Adding and updating ${items.length} activities.`);
        const activities = await utils_1.syncTransaction(this.sequelize, items, async (item, transaction) => {
            const activity = this.createActivity(item.id || item.extId);
            const id = await activity.upsert(item, transaction);
            return id;
        });
        this.logger('debug', `Finished adding and updating ${activities.length} of ${items.length}.`);
        return { [utils_1.Success]: activities };
    }
    async bulkAddWaitTimes(timestamp, items = []) {
        const { Activity } = this.dao;
        return utils_1.syncTransaction(this.sequelize, items, async (item, transaction) => {
            const { extId, waitTime } = item;
            const activityInstance = await Activity.findOne({ where: { extId } }, { transaction });
            if (!activityInstance) {
                return Promise.resolve(false); // TODO log
            }
            const activity = await this.createActivity(activityInstance);
            return activity.addWaitTimes(timestamp, waitTime, transaction);
        });
    }
    /**
     * Factory for creating a activity model.
     * @param item
     */
    createActivity(id) {
        invariant_1.default(id, 'Id is required to create an activity.');
        const { Activity } = this.models;
        return new Activity(this.sequelize, this.dao, this.logger, this.models, id);
    }
    /**
     * Retrieves an activity.
     * @param id
     * @returns - Returns an Activity model with the data loaded or null if not found
     */
    async findById(id) {
        const activity = this.createActivity(id);
        const loaded = await activity.load();
        if (!loaded) {
            return null;
        }
        return activity;
    }
    /**
     * List all activities
     * @param where - search parameters
     */
    async findAll(where) {
        const { Activity, Age, Tag, ThrillFactor } = this.dao;
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
            invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for activites.');
            query = Object.assign({}, query, { where });
        }
        const found = await Activity.findAll(query);
        // create new shop objects then parse the data
        return found.map(item => this.createActivity(item));
    }
    /**
     * Returns a list of raw activities.
     *
     * @param where - search parameters
     */
    async list(where) {
        const found = await this.findAll(where);
        return found.map(item => item.data);
    }
}
exports.default = Activities;
//# sourceMappingURL=Activities.js.map