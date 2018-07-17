import moment from 'moment';
import 'moment-holiday';
import Sequelize from 'sequelize';
import { IPark, ISchedule } from '../types';
import date from './model/date';
import park from './model/park';
import parkSchedule from './model/parkSchedule';
import schedule from './model/schedule';

const upsert = async (Model, values, condition) =>
  Model
    .findOne({ where: condition })
    .then(obj => {
      if (obj) {
        return obj.update(values);
      }
      return Model.create(values);
    });

export default (connection?: any) => {
  const sequelize = connection
    || new Sequelize({
      database: 'wdw',
      dialect: 'postgres',
      username: 'tylercvetan'
    });

  const Park = park(sequelize);
  const ParkSchedule = parkSchedule(sequelize);
  const Schedule = schedule(sequelize);
  const Date = date(sequelize);

  Date.belongsToMany(Schedule, { through: ParkSchedule });
  Schedule.belongsToMany(Date, { through: ParkSchedule });
  ParkSchedule.belongsTo(Park);

  Park.sync();
  Date.sync();
  Schedule.sync();
  ParkSchedule.sync();

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
      return Park.all({ raw: true });
    },
    async updateAllParks(items: IPark[] = []) {
      // grab all parks to see if any exist
      const updatesOrCreates = items.map((item => upsert(Park, item, { extId: item.extId })));

      return Promise.all(updatesOrCreates);
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
