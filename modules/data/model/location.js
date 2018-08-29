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
const HOTEL_TYPE = 'resort';
var GetTypes;
(function (GetTypes) {
    GetTypes["Activities"] = "activities";
})(GetTypes || (GetTypes = {}));
const addUpdateHotel = async (item, access, transaction, logger) => {
    const { Address, Hotel, Location, Room, RoomConfiguration } = access;
    logger('debug', `Adding/updating hotel ${item.extId}.`);
    const locationInstance = await utils_1.upsert(Location, item, { extId: item.extId }, transaction, [Address]);
    const hotelInstance = await utils_1.upsert(Hotel, { tier: item.tier, locationId: locationInstance.get('id') }, { locationId: locationInstance.get('id') }, transaction);
    // need to handle adding rooms separately because we want to update
    // if we have them already based on the extId
    if (item.rooms) {
        for (const room of item.rooms) {
            const roomInstance = await utils_1.upsert(Room, Object.assign({}, pick_1.default(room, RAW_ROOM_ATTRIBUTES), { hotelId: hotelInstance.get('id') }), { extId: room.extId }, transaction);
            if (room.configurations) {
                for (const configuration of room.configurations) {
                    await utils_1.upsert(RoomConfiguration, Object.assign({}, configuration, { roomId: roomInstance.get('id') }), { description: configuration.description, roomId: roomInstance.get('id') }, transaction);
                }
            }
        }
    }
    logger('debug', `Finished adding/updating hotel ${item.extId}.`);
    return locationInstance.get('id');
};
const addUpdateLocation = async (item, access, transaction, logger) => {
    const { Location } = access;
    logger('debug', `Adding/updating location ${item.extId}.`);
    const data = Object.assign({}, item, { fetchSchedule: item.type !== 'entertainment-venue' });
    const locationInstance = await utils_1.upsert(Location, data, { extId: item.extId }, transaction);
    logger('debug', `Finished adding/updating location ${item.extId}.`);
    return locationInstance.get('id');
};
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
        /**
         * Upserts locations.  Returns an errors object if known errors are found,
         * otherwise will throw an exception for everything else.
         * @param items
         */
        async addUpdate(items = []) {
            // if there are no items, just return an empty array
            const valid = exports.validateLocations(items);
            if (valid !== true) {
                // if it not valid, return the known errors
                return { [utils_1.Error]: valid };
            }
            logger('debug', `Adding and updating ${items.length} locations.`);
            const locations = await utils_1.asyncTransaction(sequelize, items, async (item, transaction) => {
                const id = item.type === HOTEL_TYPE
                    ? await addUpdateHotel(item, access, transaction, logger)
                    : await addUpdateLocation(item, access, transaction, logger);
                return api.get(id);
            });
            logger('debug', `Finished adding and updating ${locations.length} of ${items.length}.`);
            return { [utils_1.Success]: locations };
        },
        async addSchedule(locationId, scheduleDate, parkSchedules, transaction) {
            const { LocationSchedule, Schedule } = access;
            const DateModel = date_1.default(sequelize, access);
            const dateInstance = await DateModel.get(scheduleDate, transaction);
            const dateId = dateInstance.get('id');
            // Check to see if we have any schedules for this location and date already
            // this might cause issues in the future if we did not update everything,
            // worry about that if it comes up
            const alreadyAdded = await LocationSchedule
                .findOne({ where: { locationId, dateId } });
            if (alreadyAdded) {
                return null;
            }
            return Promise.all(parkSchedules.map(data => Schedule.create(data, { transaction })))
                .then(scheduleInstances => {
                return Promise.all(scheduleInstances.map(scheduleInstance => dateInstance.addSchedule(scheduleInstance, {
                    transaction,
                    through: { locationId } // tslint:disable-line
                })));
            });
        },
        async addSchedules(parkId, parkSchedules) {
            await Promise.all(Object
                .entries(parkSchedules)
                .map(([key, value]) => {
                return sequelize.transaction(t => {
                    return api.addSchedule(parkId, key, value, t);
                });
            })
                .filter(schedule => schedule !== null));
            // TODO: Figure out what to return from here, probably call get location schedule
            return { [utils_1.Success]: true };
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