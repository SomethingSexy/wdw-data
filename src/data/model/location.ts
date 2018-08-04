import invariant from 'invariant';
import { IHotel, IPark, ISchedule } from '../../types';
import { asyncTransaction, upsert } from '../utils';
import date from './date';

export default (sequelize, access) => {
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
    async findAreaByName(locationId, name, transaction) {
      const { Area } = access;
      return Area.findOne(
        { where: { locationId, name } }, { transaction }
      );
    },
    async findByName(name, transaction) {
      const { Location } = access;
      return Location.findOne(
        { where: { name } }, { transaction }
      );
    },
    /**
     * List all activities
     * @param where - search parameters
     */
    async list(where?: { [key: string]: string | boolean }) {
      const { Address, Area, Location } = access;
      if (where) {
        invariant(
          Object.keys(where).length, 'Conditions are required when searching for locations.'
        );

        return Location.findAll({
          where,
          include: [{ // tslint:disable-line
            model: Address
          }, {
            model: Area
          }],
          raw: true
        });
      }
      return Location.all({
        include: [{
          model: Address
        }, {
          model: Area
        }],
        raw: true
      });
    }
  };

  return api;
};
