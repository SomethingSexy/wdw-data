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
exports.RAW_ACTIVITY_ATTRIBUTES = [
    'admissionRequired',
    'allowServiceAnimals',
    'description',
    'extId',
    'fetchSchedule',
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
const normalizeActivity = (activity) => {
    const item = lodash_1.omit(activity, ['ActivityAges', 'ActivityTags', 'ThrillFactors']);
    item.ages = activity.ActivityAges.map(age => age.name);
    item.tags = activity.ActivityTags.map(tag => tag.name);
    item.thrills = activity.ThrillFactors.map(factor => factor.name);
    return item;
};
exports.types = {
    ENTERTAINMENT: 'entertainment'
};
class ActivityModel {
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
        return normalizeActivity(raw);
    }
    async addSchedule(scheduleDate, parkSchedules, transaction) {
        const { ActivitySchedule, Schedule } = this.dao;
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        if (!found) {
            this.logger('error', `Activity ${this.id} not found when adding a schedule.`);
            return null;
        }
        const { Date } = this.models;
        const dateModel = new Date(this.sequelize, this.dao, this.logger, scheduleDate);
        await dateModel.load(transaction);
        const dateId = dateModel.data.id;
        // Check to see if we have any schedules for this location and date already
        // this might cause issues in the future if we did not update everything,
        // worry about that if it comes up
        const alreadyAdded = await ActivitySchedule
            .findOne({ where: { activityId: this.id, dateId } });
        if (alreadyAdded) {
            return null;
        }
        return Promise.all(parkSchedules.map(async (data) => Schedule.create(data, { transaction })))
            .then(scheduleInstances => {
            return Promise.all(scheduleInstances.map(async (scheduleInstance) => dateModel.instance.addActivitySchedule(scheduleInstance, {
                through: { activityId: this.id },
                transaction
            })));
        });
    }
    async bulkAddSchedules(schedules) {
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        // if we are trying to find schedules for a location that doesn't exist
        // throw an exception here.
        if (!found) {
            this.logger('error', `Activity ${this.id} not found when adding schedules.`);
            return null;
        }
        this.logger('debug', this.instance.get('fetchSchedule'));
        if (!this.instance.get('fetchSchedule')) {
            this.logger('error', `Activity ${this.id} does not support schedules.`);
            return null;
        }
        await Promise.all(Object
            .entries(schedules)
            .map(async ([key, value]) => {
            return this.sequelize.transaction(t => {
                return this.addSchedule(key, value, t);
            });
        }));
        // TODO: Figure out what to return from here
        return { [utils_1.Success]: true };
    }
    async addWaitTimes(timestamp, waitTime, transaction) {
        const { WaitTime } = this.dao;
        const { Date } = this.models;
        const dateModel = new Date(this.sequelize, this.dao, this.logger, timestamp);
        await dateModel.load();
        const dateId = dateModel.data.id;
        // TODO: Do we want to store another id for the timestamp or
        // just do find by activityId, dateId and groupby timestamp?
        return WaitTime.create({
            activityId: this.id,
            dateId,
            fastPassAvailable: waitTime.fastPass.available,
            singleRider: waitTime.singleRider,
            status: waitTime.status,
            statusMessage: waitTime.rollUpStatus,
            timestamp,
            wait: waitTime.postedWaitMinutes,
            waitMessage: waitTime.rollUpWaitTimeMessage
        }, { transaction });
    }
    async load() {
        const { Activity, Age, Tag, ThrillFactor } = this.dao;
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
        const query = {
            attributes: exports.RAW_ACTIVITY_ATTRIBUTES,
            include: queryInclude,
            where: { [this.idKey]: this.id }
        };
        if (this.instance) {
            await this.instance.reload(query);
        }
        else {
            this.instance = await Activity.findOne(query);
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
    async getSchedule(byDate) {
        // First lets verify that this activity exists
        const { Date, ActivitySchedule, Schedule } = this.dao;
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        // if we are trying to find schedules for an activity that doesn't exist
        if (!found) {
            this.logger('error', `Location ${this.id} not found when searching for schedules.`);
            return null;
        }
        // Grab the date instance, if there is no date, that means we do not
        // have any schedules for this location.
        const dateInst = await Date.findOne({ where: { date: byDate } });
        if (!dateInst) {
            this.logger('debug', `No date for ${byDate} when searching for schedules for activity ${this.id}`);
            return [];
        }
        const schedules = await ActivitySchedule.findAll({
            include: [{
                    model: Schedule
                }, {
                    model: Date
                }],
            where: { dateId: dateInst.get('id'), activityId: this.instance.get('id') },
        });
        return schedules.map(item => {
            const raw = item.get({ plain: true });
            return Object.assign({}, lodash_1.pick(raw.schedule, ['closing', 'opening', 'isSpecialHours', 'type']), lodash_1.pick(raw.date, ['date', 'holiday', 'isHoliday']));
        });
    }
    /**
     * Returns waittimes for an activity, if they are available
     * @param id
     * @param dates
     */
    async getWaittimes(dates) {
        invariant_1.default(dates.length, 'Dates are required to get wait times.');
        const { Date, WaitTime } = this.dao;
        let found = true;
        if (!this.instance) {
            found = await this.load();
        }
        // if we are trying to find schedules for an activity that doesn't exist
        if (!found) {
            this.logger('error', `Location ${this.id} not found when searching for schedules.`);
            return null;
        }
        const waitTimes = await Promise.all(dates.map(async (byDate) => {
            this.logger('debug', `Fetching wait times for ${this.id} ${byDate}.`);
            const dateInst = await Date.findOne({ where: { date: byDate } });
            if (!dateInst) {
                this.logger('debug', `No date for ${byDate} when searching for wait times for activity ${this.id}`);
                return null;
            }
            const times = await WaitTime.findAll({ where: { dateId: dateInst.get('id'), activityId: this.id } });
            this.logger('debug', `Found ${times.length} wait times for ${this.id} ${byDate}.`);
            // need to make sure we convert over to the plain objects
            return {
                date: byDate,
                waitTimes: times.map(item => item.get({ plain: true }))
            };
        }));
        return waitTimes
            .reduce((all, d) => {
            if (!d) {
                return all;
            }
            return Object.assign({}, all, { [d.date]: d.waitTimes });
        }, {});
    }
    async upsert(item, transaction) {
        this.logger('debug', `Adding/updating activity ${item.extId}.`);
        const Locations = this.locations;
        const { Activity, Age, Tag, ThrillFactor } = this.dao;
        const activityItem = {
            admissionRequired: item.admissionRequired,
            allowServiceAnimals: item.allowServiceAnimals,
            description: item.description,
            extId: item.extId,
            extRefName: item.extRefName,
            fastPass: item.fastPass,
            fastPassPlus: item.fastPassPlus,
            // only rule so far
            fetchSchedule: item.type === exports.types.ENTERTAINMENT,
            height: item.height,
            latitude: item.coordinates ? item.coordinates.gps.latitude : null,
            longitude: item.coordinates ? item.coordinates.gps.longitude : null,
            name: item.name,
            riderSwapAvailable: item.riderSwapAvailable,
            type: item.type,
            url: item.url,
            wheelchairTransfer: item.wheelchairTransfer
        };
        if (item.id) {
            activityItem.id = item.id;
        }
        const activityInst = await utils_1.upsert(Activity, activityItem, { extId: item.extId }, transaction);
        if (item.location) {
            const location = await Locations.findByName(item.location, transaction);
            if (location) {
                await activityInst.setLocation(location.instance, { transaction });
                if (item.area) {
                    let areaInst = await location.findAreaByName(item.area, transaction);
                    if (!areaInst) {
                        areaInst = await location.addArea(item.area, transaction);
                    }
                    await activityInst.setArea(areaInst, { transaction });
                }
            }
        }
        // check thrill factors
        if (item.thrills) {
            // either sync or async with Promise.all
            for (const factor of item.thrills) {
                const thrillInst = await utils_1.upsert(ThrillFactor, { name: factor }, { name: factor }, transaction);
                if (!await activityInst.hasThrillFactors(thrillInst)) {
                    await activityInst.addThrillFactors(thrillInst, { transaction });
                }
            }
        }
        if (item.ages) {
            // either sync or async with Promise.all
            for (const ageName of item.ages) {
                const ageInst = await utils_1.upsert(Age, { name: ageName }, { name: ageName }, transaction);
                if (!await activityInst.hasActivityAges(ageInst)) {
                    await activityInst.addActivityAges(ageInst, { transaction });
                }
            }
        }
        if (item.tags) {
            // either sync or async with Promise.all
            for (const tagName of item.tags) {
                const tagInst = await utils_1.upsert(Tag, { name: tagName, from: 'activity' }, { name: tagName }, transaction);
                if (!await activityInst.hasActivityTags(tagInst)) {
                    await activityInst.addActivityTags(tagInst, { transaction });
                }
            }
        }
        this.logger('debug', `Finished adding/updating activity ${item.extId}.`);
        return activityInst.get('id');
    }
}
exports.default = ActivityModel;
//# sourceMappingURL=Activity.js.map