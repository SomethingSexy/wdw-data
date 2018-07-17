import Sequelize from 'sequelize';
import { IDate, IPark } from '../types';
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

  // TODO: Figure out where to put these
  // probably separate files per "model" that would get passed the sequeilize models
  return {
    async listAllParks() {
      return Park.all({ raw: true });
    },
    async updateAllParks(items: IPark[] = []) {
      // grab all parks to see if any exist
      const updatesOrCreates = items.map((item => upsert(Park, item, { extId: item.extId })));

      return Promise.all(updatesOrCreates);
    },
    async addParkSchedules(dateInfo: IDate, schedules) {
      // check if date exists already.
      sequelize.transaction(t => {
        return Date
          .findOne({ where: { date: dateInfo.date } }, { transaction: t })
          .then(project => {
            console.log(project, schedules);
          });
        // return sequelize.Promise.each(arrToUpdate, function(itemToUpdate){
        //   model.update(itemToUpdate, { transaction: t })
        // }).then((updateResult) => {
        //   return model.bulkCreate(itemsArray, { transaction: t })
        // }, (err) => {
        //   // if update throws an error, handle it here.
        // });
      });
    }
  };
};
