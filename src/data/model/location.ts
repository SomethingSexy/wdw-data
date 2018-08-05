import invariant from 'invariant';
import pick from 'lodash/pick'; // tslint:disable-line
import { IHotel, IPark, ISchedule } from '../../types';
import { asyncTransaction, upsert } from '../utils';
import date from './date';

const RAW_LOCATION_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url'];
enum GetTypes {
  Activities = 'activities'
}

export default (sequelize, access, logger) => {
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
    async addUpdateHotels(items: IHotel[] = []) {
      const { Address, Hotel, Location } = access;
      return asyncTransaction(sequelize, items, async (item, t) => {
        const locationInstance = await upsert(
          Location, item, { extId: item.extId }, t, [Address]
        );
        return upsert(
            Hotel,
            { tier: item.tier, locationId: locationInstance.get('id') },
            { locationId: locationInstance.get('id') },
            t
          );
      });
    },
    async addUpdateParks(items: IPark[] = []) {
      const { Location } = access;
      return Promise.all(
        items
          .map(item => {
            const data = {
              ...item,
              fetchSchedule: item.type !== 'entertainment-venue'
            };
            return sequelize.transaction(t => {
              return upsert(Location, data, { extId: item.extId }, t);
            });
          })
        );
    },
    async addParkSchedule(
      locationId: string, scheduleDate: string, parkSchedules, transaction
    ) {
      const { Schedule } = access;

      const DateModel = date(sequelize, access);
      const dateInstance = await DateModel.get(scheduleDate, transaction);

      // TODO: Check to see if we already have a schedule for that day
      return Promise.all(
        parkSchedules.map(data => Schedule.create(data, { transaction }))
      )
      .then(scheduleInstances => {
        return Promise.all(
          scheduleInstances.map(scheduleInstance =>
            dateInstance.addSchedule(
              scheduleInstance,
              {
                transaction,
                through: { locationId } // tslint:disable-line
              }
            )
          )
        );
      });
    },
    async addParkSchedules(parkId: string, parkSchedules: {[date: string]: ISchedule[]}) {
      // check if date exists already.
      return Promise.all(
        Object
          .entries(parkSchedules)
          .map(([key, value]) => {
            return sequelize.transaction(t => {
              return api.addParkSchedule(parkId, key, value, t);
            });
          })
        );
    },
    /**
     * Searches for an area instance.
     * @param locationId
     * @param name
     * @param transaction
     */
    async findAreaByName(locationId, name, transaction) {
      const { Area } = access;
      return Area.findOne(
        { where: { locationId, name } }, { transaction }
      );
    },
    /**
     * Searches for a location instance by name
     * @param name
     * @param transaction
     */
    async findByName(name, transaction) {
      const { Location } = access;
      return Location.findOne(
        { where: { name } }, { transaction }
      );
    },
    /**
     * Returns a raw location by id.
     * @param id
     */
    async get(id: string, include?: GetTypes[]) {
      const { Activity, Address, Area, Hotel, Location } = access;
      // setting to any because I am not gonna repeat sequelize's api
      const queryInclude: any[] = [{
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

      const location = await sequelize.transaction(async transaction => {
        const found = await Location.findOne(
          {
            attributes: RAW_LOCATION_ATTRIBUTES,
            include: queryInclude,
            where: { id }
          },
          { transaction }
        );

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
          raw = {
            ...raw,
            tier: hotel.get('tier')
          };
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
    async getLocationSchedule(id: string, byDate: string) {
      // First lets verify that this location exists
      const { Date, Location, LocationSchedule, Schedule } = access;
      const found = await Location.findOne({ where: { id } });
      // if we are trying to find schedules for a location that doesn't exist
      // throw an exception here.
      if (!found) {
        logger('debug', `Location ${id} not found when searching for schedules.`);
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
        return {
          ...pick(raw.schedule, ['closing', 'opening', 'isSpecialHours', 'type']),
          ...pick(raw.date, ['date', 'holiday', 'isHoliday'])
        };
      });
    },
    /**
     * List all activities
     * @param where - search parameters
     */
    async list(where?: { [key: string]: string | boolean }) {
      const { Address, Area, Location } = access;
      let query: { attributes: string[], include: any[], where?: any } = {
        attributes: RAW_LOCATION_ATTRIBUTES, // tslint:disable-line
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
        invariant(
          Object.keys(where).length, 'Conditions are required when searching for locations.'
        );
        query = {
          ...query,
          where
        };
      }

      const found = await Location.findAll(query);

      return found.map(item => item.get({ plain: true }));
    }
  };

  return api;
};
