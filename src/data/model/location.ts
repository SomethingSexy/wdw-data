import { IHotel, IPark, ISchedule } from '../../types';
import { asyncTransaction, upsert } from '../utils';
import date from './date';

export default (sequelize, access) => {
  const api = {
    async listAllParks() {
      const { Location } = access;
      return Location.all({ raw: true });
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
            return sequelize.transaction(t => {
              return upsert(Location, item, { extId: item.extId }, t);
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
    }
  };

  return api;
};
