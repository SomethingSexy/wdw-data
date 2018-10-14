import Sequelize from 'sequelize';
import { IConnection, ILogger } from '../types';
import createAccessObjects from './dao/index';
import Activities from './model/Activities';
import Activity from './model/Activity';
import Date from './model/Date';
import Location from './model/Location';
import Locations from './model/Locations';
import Park from './model/Park';
import Parks from './model/Parks';
import Resort from './model/Resort';
import Resorts from './model/Resorts';
import Restaurant from './model/Restaurant';
import Restaurants from './model/Restaurants';
import Shop from './model/Shop';
import Shops from './model/Shops';
import { Error, Success } from './utils';

export const responseHandlers = { Error, Success };
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
  // around the data access objects,
  // for now we are creating a single instance here, turn into factory methods if we want
  // to create instances outside of here
  const locationModels = { Date, Location, Park, Resort };
  const activity = new Activities(
    sequelize, accessObjects, logger, { Activity, Date, Location, Locations }
  );
  const dining = new Restaurants(
    sequelize, accessObjects, logger, { Location, Locations, Restaurant }
  );
  const location = new Locations(sequelize, accessObjects, logger, locationModels);
  const park = new Parks(sequelize, accessObjects, logger, locationModels);
  const resort = new Resorts(sequelize, accessObjects, logger, locationModels);
  const shop = new Shops(sequelize, accessObjects, logger, { Location, Locations, Shop });

  return {
    activity,
    dining,
    location,
    park,
    resort,
    shop
  };
};
