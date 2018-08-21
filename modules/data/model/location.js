"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const pick_1 = __importDefault(require("lodash/pick")); // tslint:disable-line
const utils_1 = require("../utils");
const date_1 = __importDefault(require("./date"));
// Note: extId is on here right now for the jobs
const RAW_LOCATION_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url', 'extId'];
const RAW_ROOM_ATTRIBUTES = [
    'bedsDescription',
    'occupancy',
    'occupancyDescription',
    'view',
    'description',
    'extId',
    'name',
    'pricingUrl'
];
var GetTypes;
(function (GetTypes) {
    GetTypes["Activities"] = "activities";
})(GetTypes || (GetTypes = {}));
exports.default = (sequelize, access, logger) => {
    const api = {
        async addArea(locationId, name, transaction) {
            const { Area } = access;
            // location and name should be unique combination
            const exist = await api.findAreaByName(locationId, name, transaction);
            if (exist) {
                return exist;
            }
            return Area.create({ locationId, name }, { transaction });
        },
        async addUpdateHotels(items = []) {
            const { Address, Hotel, Location, Room, RoomConfiguration } = access;
            return utils_1.asyncTransaction(sequelize, items, async (item, t) => {
                const locationInstance = await utils_1.upsert(Location, item, { extId: item.extId }, t, [Address]);
                const hotelInstance = await utils_1.upsert(Hotel, { tier: item.tier, locationId: locationInstance.get('id') }, { locationId: locationInstance.get('id') }, t);
                // need to handle adding rooms separately because we want to update
                // if we have them already based on the extId
                if (item.rooms) {
                    for (const room of item.rooms) {
                        const roomInstance = await utils_1.upsert(Room, Object.assign({}, pick_1.default(room, RAW_ROOM_ATTRIBUTES), { hotelId: hotelInstance.get('id') }), { extId: room.extId }, t);
                        if (room.configurations) {
                            for (const configuration of room.configurations) {
                                await utils_1.upsert(RoomConfiguration, Object.assign({}, configuration, { roomId: roomInstance.get('id') }), { description: configuration.description, roomId: roomInstance.get('id') }, t);
                            }
                        }
                    }
                }
                // TODO: Figure out what to return here
                return Promise.resolve();
            });
        },
        async addUpdateParks(items = []) {
            const { Location } = access;
            return Promise.all(items
                .map(item => {
                const data = Object.assign({}, item, { fetchSchedule: item.type !== 'entertainment-venue' });
                return sequelize.transaction(t => {
                    return utils_1.upsert(Location, data, { extId: item.extId }, t);
                });
            }));
        },
        async addParkSchedule(locationId, scheduleDate, parkSchedules, transaction) {
            const { Schedule } = access;
            const DateModel = date_1.default(sequelize, access);
            const dateInstance = await DateModel.get(scheduleDate, transaction);
            // TODO: Check to see if we already have a schedule for that day
            return Promise.all(parkSchedules.map(data => Schedule.create(data, { transaction })))
                .then(scheduleInstances => {
                return Promise.all(scheduleInstances.map(scheduleInstance => dateInstance.addSchedule(scheduleInstance, {
                    transaction,
                    through: { locationId } // tslint:disable-line
                })));
            });
        },
        async addParkSchedules(parkId, parkSchedules) {
            // check if date exists already.
            return Promise.all(Object
                .entries(parkSchedules)
                .map(([key, value]) => {
                return sequelize.transaction(t => {
                    return api.addParkSchedule(parkId, key, value, t);
                });
            }));
        },
        /**
         * Searches for an area instance.
         * @param locationId
         * @param name
         * @param transaction
         */
        async findAreaByName(locationId, name, transaction) {
            const { Area } = access;
            return Area.findOne({ where: { locationId, name } }, { transaction });
        },
        /**
         * Searches for a location instance by name
         * @param name
         * @param transaction
         */
        async findByName(name, transaction) {
            const { Location } = access;
            return Location.findOne({ where: { name } }, { transaction });
        },
        /**
         * Returns a raw location by id.
         * @param id
         */
        async get(id, include) {
            const { Activity, Address, Area, Hotel, Location } = access;
            // setting to any because I am not gonna repeat sequelize's api
            const queryInclude = [{
                    as: 'address',
                    attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
                    model: Address
                }, {
                    as: 'areas',
                    attributes: ['name'],
                    model: Area
                }];
            // check to see if we are including different associations
            if (include) {
                include.forEach(i => {
                    if (i === GetTypes.Activities) {
                        queryInclude.push({
                            as: 'activities',
                            attributes: ['id', 'name', 'description', 'type', 'url'],
                            include: [{
                                    as: 'area',
                                    attributes: ['name'],
                                    model: Area
                                }],
                            model: Activity
                        });
                    }
                });
            }
            const location = await sequelize.transaction(async (transaction) => {
                const found = await Location.findOne({
                    attributes: RAW_LOCATION_ATTRIBUTES,
                    include: queryInclude,
                    where: { id }
                }, { transaction });
                if (!found) {
                    // let the caller handle not found
                    return null;
                }
                let raw = found.get({ plain: true });
                // if this is a resort, then we need to grab the resort information
                if (found.get('type') === 'resort') {
                    const hotel = await Hotel
                        .findOne({ where: { locationId: found.get('id') } }, { transaction });
                    // just save off tier for now
                    raw = Object.assign({}, raw, { tier: hotel.get('tier') });
                }
                return raw;
            });
            return location;
        },
        /**
         * Retrieves schedules for a given day.
         * @param id
         * @param date
         * @returns - Array of schedules for the given day.  Returns null if the location cannot b
         *            found or an empty array if no schedules are found.
         */
        async getLocationSchedule(id, byDate) {
            // First lets verify that this location exists
            const { Date, Location, LocationSchedule, Schedule } = access;
            const found = await Location.findOne({ where: { id } });
            // if we are trying to find schedules for a location that doesn't exist
            // throw an exception here.
            if (!found) {
                logger('error', `Location ${id} not found when searching for schedules.`);
                return null;
            }
            // Grab the date instance, if there is no date, that means we do not
            // have any schedules for this location.
            const dateInst = await Date.findOne({ where: { date: byDate } });
            if (!dateInst) {
                logger('debug', `No date for ${byDate} when searching for schedules for location ${id}`);
                return [];
            }
            // I am sure there is a better way to do this
            const schedules = await LocationSchedule.findAll({
                include: [{
                        model: Schedule
                    }, {
                        model: Date
                    }],
                where: { dateId: dateInst.get('id'), locationId: found.get('id') },
            });
            return schedules.map(item => {
                const raw = item.get({ plain: true });
                return Object.assign({}, pick_1.default(raw.schedule, ['closing', 'opening', 'isSpecialHours', 'type']), pick_1.default(raw.date, ['date', 'holiday', 'isHoliday']));
            });
        },
        /**
         * List all activities
         * @param where - search parameters
         */
        async list(where) {
            const { Address, Area, Location } = access;
            let query = {
                attributes: RAW_LOCATION_ATTRIBUTES,
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
            return found.map(item => item.get({ plain: true }));
        }
    };
    return api;
};
//# sourceMappingURL=location.js.map