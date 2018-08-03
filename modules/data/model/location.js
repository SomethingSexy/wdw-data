"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const utils_1 = require("../utils");
const date_1 = __importDefault(require("./date"));
exports.default = (sequelize, access) => {
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
            const { Address, Hotel, Location } = access;
            return utils_1.asyncTransaction(sequelize, items, async (item, t) => {
                const locationInstance = await utils_1.upsert(Location, item, { extId: item.extId }, t, [Address]);
                return utils_1.upsert(Hotel, { tier: item.tier, locationId: locationInstance.get('id') }, { locationId: locationInstance.get('id') }, t);
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
        async findAreaByName(locationId, name, transaction) {
            const { Area } = access;
            return Area.findOne({ where: { locationId, name } }, { transaction });
        },
        async findByName(name, transaction) {
            const { Location } = access;
            return Location.findOne({ where: { name } }, { transaction });
        },
        /**
         * List all activities
         * @param where - search parameters
         */
        async list(where) {
            const { Location } = access;
            if (where) {
                invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for locations.');
                return Location.findAll({ where, raw: true });
            }
            return Location.all({ raw: true });
        }
    };
    return api;
};
//# sourceMappingURL=location.js.map