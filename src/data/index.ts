import moment from 'moment';
import 'moment-holiday';
import Sequelize from 'sequelize';
import { IAttraction, IHotel, IPark, ISchedule } from '../types';
import activity from './model/activity';
import address from './model/address';
import date from './model/date';
import hotel from './model/hotel';
import location from './model/location';
import locationSchedule from './model/locationSchedule';
import schedule from './model/schedule';
import thrillFactor from './model/thrillFactor';
import { asyncTransaction, syncTransaction, upsert } from './utils';

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

  const Activity = activity(sequelize);
  const Address = address(sequelize);
  const Location = location(sequelize);
  const LocationSchedule = locationSchedule(sequelize);
  const Schedule = schedule(sequelize);
  const Date = date(sequelize);
  const Hotel = hotel(sequelize);
  const ThrillFactor = thrillFactor(sequelize);

  Date.belongsToMany(Schedule, { through: LocationSchedule });
  Schedule.belongsToMany(Date, { through: LocationSchedule });
  LocationSchedule.belongsTo(Location);
  Hotel.belongsTo(Location);
  Location.belongsTo(Address);
  Activity.belongsTo(Location);
  Activity.belongsToMany(
    ThrillFactor, { as: 'ThrillFactors', through: 'activities_thrill_factors' }
  );
  ThrillFactor.belongsToMany(
    Activity, { as: 'ThrillFactors', through: 'activities_thrill_factors' }
  );

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
    async addUpdateActivities(items: IAttraction[] = []) {
      return syncTransaction(sequelize, items, async (item, t) => {
        const activityItem: any = {
          admissionRequired: item.restrictions.admissionRequired,
          age: item.restrictions.age,
          allowServiceAnimals: item.restrictions.allowServiceAnimals,
          description: item.description,
          extId: item.extId,
          extRefName: item.extRefName,
          fastPass: item.fastPass,
          fastPassPlus: item.fastPassPlus,
          height: item.restrictions.height,
          latitude: item.coordinates ? item.coordinates.gps.latitude : null,
          longitude: item.coordinates ? item.coordinates.gps.longitude : null,
          name: item.name,
          riderSwapAvailable: item.restrictions.riderSwapAvailable,
          type: item.type,
          url: item.url,
          wheelchairTransfer: item.restrictions.wheelchairTransfer
        };
        if (item.id) {
          activityItem.id = item.id;
        }

        const activityInstance = await upsert(
          Activity, activityItem, { extId: item.extId }, t
        );
        if (item.location) {
          const locationInstance = await Location.findOne(
            { where: { name: item.location } }, { transaction: t }
          );
          if (locationInstance) {
            await activityInstance.setLocation(locationInstance, { transaction: t });
          }
          // TODO: else log an issue if we cannot find a location
        }
        // check thrill factors
        if (item.thrillFactor) {
          // either sync or async with Promise.all
          for (const factor of item.thrillFactor) {
            const thrillInstance = await upsert(
              ThrillFactor, { name: factor }, { name: factor }, t
            );
            if (!await activityInstance.hasThrillFactors(thrillInstance)) {
              await activityInstance.addThrillFactors(thrillInstance, { transaction: t });
            }
          }
        }

        return activityInstance;
      });
    },
    async addUpdateHotels(items: IHotel[] = []) {
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
