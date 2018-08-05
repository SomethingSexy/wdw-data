import Sequelize from 'sequelize';
import { ILogType } from '../types';
import createAccessObjects from './dao/index';
import createActivity from './model/activity';
import createLocation from './model/location';

const createLogger = (logger?: ILogType) =>
  (type: string, message: string) => {
    if (logger) {
      logger.log(type, message);
    }
  };

/**
 * Setups database connection, creates data access layer, and setups models for
 * working with the data.
 */
export default async (connection?: any, logger?: ILogType) => {
  // create our connection
  const sequelize = connection
    || new Sequelize({
      database: 'wdw',
      dialect: 'postgres',
      pool: {
        max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
      },
      username: 'tylercvetan',
    });

  const internalLogger = createLogger(logger);

  // get our data access objects
  const accessObjects = createAccessObjects(sequelize);

  // Sync with the database
  await sequelize.sync();

  // setup models, these will be higher level objects that will handle the business logic
  // around the data access objects
  const activity = createActivity(sequelize, accessObjects, internalLogger);
  const location = createLocation(sequelize, accessObjects, internalLogger);

  return {
    activity,
    location
  };
};
