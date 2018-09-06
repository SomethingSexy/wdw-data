import invariant from 'invariant';
import pick from 'lodash/pick'; // tslint:disable-line
import { ILocation, ISchedule } from '../../types';
import { asyncTransaction, Error, Success, upsert } from '../utils';
import date from './date';

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

enum GetTypes {
  Activities = 'activities'
}

const addUpdateHotel = async (item: ILocation, access, transaction, logger) => {
  const { Address, BusStop, Hotel, Location, Room, RoomConfiguration } = access;
  logger('debug', `Adding/updating hotel ${item.extId}.`);

  const locationInstance = await upsert(
    Location, item, { extId: item.extId }, transaction, [Address]
  );
  const hotelInstance = await upsert(
    Hotel,
    { tier: item.tier, locationId: locationInstance.get('id') },
    { locationId: locationInstance.get('id') },
    transaction,
  );
  // need to handle adding rooms separately because we want to update
  // if we have them already based on the extId
  if (item.rooms) {
    for (const room of item.rooms) {
      const roomInstance = await upsert(
        Room,
        { ...pick(room, RAW_ROOM_ATTRIBUTES), hotelId: hotelInstance.get('id') },
        { extId: room.extId },
        transaction
      );

      if (room.configurations) {
        for (const configuration of room.configurations) {
          await upsert(
            RoomConfiguration,
            { ...configuration, roomId: roomInstance.get('id') },
            { description: configuration.description, roomId: roomInstance.get('id') },
            transaction
          );
        }
      }
    }
  }

  if (item.busStops) {
    // either sync or async with Promise.all
    for (const stop of item.busStops) {
      await BusStop
        .findOne({ where: { hotelId: hotelInstance.get('id'), name: stop } }, { transaction })
        .then(obj => {
          if (!obj) {
            return BusStop.create(
              { hotelId: hotelInstance.get('id'), name: stop }, { transaction }
            );
          }

          return Promise.resolve();
        });
    }
  }

  logger('debug', `Finished adding/updating hotel ${item.extId}.`);
  return locationInstance.get('id');
};

const addUpdateLocation = async (item: ILocation, access, transaction, logger) => {
  const { Location } = access;
  logger('debug', `Adding/updating location ${item.extId}.`);

  const data = {
    ...item,
    fetchSchedule: item.type !== 'entertainment-venue'
  };
  const locationInstance = await upsert(Location, data, { extId: item.extId }, transaction);

  logger('debug', `Finished adding/updating location ${item.extId}.`);
  return locationInstance.get('id');
};

/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateLocation = (item: ILocation) => {
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
export const validateLocations = (items: ILocation[]) => {
  if (!items || !items.length) {
    return 'Locations are required to add or update.';
  }
  const errors = items
    .map(validateLocation)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

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
    /**
     * Upserts locations.  Returns an errors object if known errors are found,
     * otherwise will throw an exception for everything else.
     * @param items
     */
    async addUpdate(items: ILocation[] = []): Promise<{[Error]?: any; [Success]?: any; }> {
      // if there are no items, just return an empty array
      const valid = validateLocations(items);
      if (valid !== true) {
        // if it not valid, return the known errors
        return { [Error]: valid };
      }
      logger('debug', `Adding and updating ${items.length} locations.`);
      const locations = await asyncTransaction(sequelize, items, async (item, transaction) => {
        const id = item.type === HOTEL_TYPE
          ? await addUpdateHotel(item, access, transaction, logger)
          : await addUpdateLocation(item, access, transaction, logger);

        return api.get(id);
      });

      logger('debug', `Finished adding and updating ${locations.length} of ${items.length}.`);
      return { [Success]: locations };
    },
    async addSchedule(
      locationId: string, scheduleDate: string, parkSchedules, transaction
    ) {
      const { LocationSchedule, Schedule } = access;

      const DateModel = date(sequelize, access);
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
    async addSchedules(parkId: string, parkSchedules: {[date: string]: ISchedule[]}) {
      await Promise.all(
        Object
          .entries(parkSchedules)
          .map(([key, value]) => {
            return sequelize.transaction(t => {
              return api.addSchedule(parkId, key, value, t);
            });
          })
          .filter(schedule => schedule !== null)
        );

      // TODO: Figure out what to return from here, probably call get location schedule
      return { [Success]: true };
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
