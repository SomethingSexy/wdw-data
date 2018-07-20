import moment from 'moment';
import 'moment-holiday';
import Sequelize from 'sequelize';
import { IHotel, IPark, ISchedule } from '../types';
import address from './model/address';
import date from './model/date';
import hotel from './model/hotel';
import location from './model/location';
import locationSchedule from './model/locationSchedule';
import schedule from './model/schedule';

const upsert = async (Model, values, condition, transaction, include?) => {
  let options: any = { transaction };
  if (include) {
    options = {
      ...options,
      include
    };
  }
  return Model
    .findOne({ where: condition }, { transaction })
    .then(obj => {
      if (obj) {
        return obj.update(values, options);
      }

      return Model.create(values, options);
    });
};

export default (connection?: any) => {
  const sequelize = connection
    || new Sequelize({
      database: 'wdw',
      dialect: 'postgres',
      pool: {
        max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
      },
      username: 'tylercvetan',
    });

  const Address = address(sequelize);
  const Location = location(sequelize);
  const LocationSchedule = locationSchedule(sequelize);
  const Schedule = schedule(sequelize);
  const Date = date(sequelize);
  const Hotel = hotel(sequelize);

  Date.belongsToMany(Schedule, { through: LocationSchedule });
  Schedule.belongsToMany(Date, { through: LocationSchedule });
  LocationSchedule.belongsTo(Location);
  Hotel.belongsTo(Location);
  Location.belongsTo(Address);

  sequelize.sync();

  // TODO: move
  const addParkSchedule = async (
    parkId: string, scheduleDate: string, parkSchedules, transaction
  ) => {
    let cacheDate;
    return Date
      .findOne({ where: { date: scheduleDate } }, { transaction })
      .then(d => {
        if (!d) {
          const mDate = moment(scheduleDate);
          const holiday = mDate.isHoliday();
          return Date.create(
            {
              date: scheduleDate,
              holiday: holiday || null,
              isHoliday: !!holiday
            },
            { transaction }
          );
        }

        return Promise.resolve(d);
      })
      .then(dateInstance => {
        cacheDate = dateInstance;
        return Promise.all(
          parkSchedules.map(data => Schedule.create(data, { transaction }))
        );
      })
      .then(scheduleInstances => {
        return Promise.all(
          scheduleInstances.map(scheduleInstance =>
            cacheDate.addSchedule(
              scheduleInstance,
              {
                transaction,
                through: { parkId } // tslint:disable-line
              }
            )
          )
        );
      });
  };

  // TODO: Figure out where to put these
  // probably separate files per "model" that would get passed the sequeilize models (name them doa)
  return {
    async listAllParks() {
      return Location.all({ raw: true });
    },
    async updateAllHotels(items: IHotel[] = []) {
      return Promise.all(
        items
          .map(item => {
            return sequelize.transaction(async t => {
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
          })
        );
    },
    async updateAllParks(items: IPark[] = []) {
      return Promise.all(
        items
          .map(item => {
            return sequelize.transaction(t => {
              return upsert(Location, item, { extId: item.extId }, t);
            });
          })
        );
    },
    async addParkSchedules(parkId: string, parkSchedules: {[date: string]: ISchedule[]}) {
      // check if date exists already.
      return Promise.all(
        Object
          .entries(parkSchedules)
          .map(([key, value]) => {
            return sequelize.transaction(t => {
              return addParkSchedule(parkId, key, value, t);
            });
          })
        );
    }
  };
};
