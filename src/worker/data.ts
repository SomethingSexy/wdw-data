import { createModels, realtime } from '../index';
import logger from '../log';

interface IOptions {
  attractions?: boolean;
  dining?: boolean;
  entertainment?: boolean;
  hotels?: boolean;
  parks?: boolean;
  shops?: boolean;
}

/**
 * A service for retrieving and persisting waitimes.
 */
export default async (options: IOptions = {
  attractions: true, dining: true, entertainment: true, hotels: true , parks: true, shops: true
}) => {
  // setup our database connection
  const models = await createModels(
    {
      database: 'wdw',
      logging: false,
      pool: {
        max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
      },
      username: 'tylercvetan',
    },
    logger
  );

  const realtimeModels = realtime(logger);

  // // grab our realtime park data
  if (options.parks) {
    try {
      const parks = await realtimeModels
        .parks
        .list();

      logger.log('info', JSON.stringify(parks, null, 4));
      await models.location.addUpdate(parks);
    } catch (e) {
      logger.log('error', e.toString());
    }
  }

  if (options.hotels) {
    try {
      const hotels = await realtimeModels
        .hotels
        .list();

      logger.log('info', JSON.stringify(hotels, null, 4));
      await models.location.addUpdate(hotels);
    } catch (e) {
      logger.log('error', e.toString());
    }
  }

  if (options.attractions) {
    try {
      const attractions = await realtimeModels
        .attractions
        .list();

      logger.log('info', JSON.stringify(attractions, null, 4));
      await models.activity.addUpdate(attractions);
    } catch (e) {
      logger.log('error', e.toString());
    }
  }

  if (options.entertainment) {
    try {
      const entertainment = await realtimeModels
        .entertainment
        .list();

      logger.log('info', JSON.stringify(entertainment, null, 4));
      await models.activity.addUpdate(entertainment);
    } catch (e) {
      logger.log('error', e.toString());
    }
  }

  if (options.dining) {
    try {
      const dining = await realtimeModels
        .dining
        .list({ max: 50 });
      logger.log('info', JSON.stringify(dining, null, 4));
      await models.dining.addUpdate(dining);
    } catch (e) {
      logger.log('error', e.toString());
    }
  }

  if (options.shops) {
    try {
      const shops = await realtimeModels
        .shops
        .list({ max: 60 });
      logger.log('info', JSON.stringify(shops, null, 4));
      await models.shop.addUpdate(shops);
    } catch (e) {
      logger.log('error', e.toString());
    }
  }
};
