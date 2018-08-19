import Sequelize from 'sequelize';
import { IConnection, ILogger } from '../types';
import createAccessObjects from './dao/index';
import createActivity from './model/activity';
import createDining from './model/dining';
import createLocation from './model/location';

/**
 * Setups database connection, creates data access layer, and setups models for
 * working with the data.
 */
export default async (connection: any | IConnection, logger: ILogger) => {
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

  // get our data access objects
  const accessObjects = createAccessObjects(sequelize);

  // Sync with the database
  await sequelize.sync();

  // setup models, these will be higher level objects that will handle the business logic
  // around the data access objects
  const activity = createActivity(sequelize, accessObjects, logger);
  const dining = createDining(sequelize, accessObjects, logger);
  const location = createLocation(sequelize, accessObjects, logger);

  return {
    activity,
    dining,
    location
  };
};
