import { createModels, realtime } from '../index';
import logger from '../log';

/**
 * A service for retrieving and persisting waitimes.
 */
export default async () => {
  // // setup our database connection
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
  try {
    const parks = await realtimeModels
      .parks
      .list();

    logger.log('info', JSON.stringify(parks, null, 4));
    await models.location.addUpdateParks(parks);
  } catch (e) {
    logger.log('error', e);
  }

  try {
    const hotels = await realtimeModels
      .hotels
      .list();

    logger.log('info', JSON.stringify(hotels, null, 4));
    await models.location.addUpdateHotels(hotels);
  } catch (e) {
    logger.log('error', e);
  }

  try {
    const attractions = await realtimeModels
      .attractions
      .list();

    logger.log('info', JSON.stringify(attractions, null, 4));
    await models.activity.addUpdateActivities(attractions);
  } catch (e) {
    logger.log('error', e);
  }

  try {
    const entertainment = await realtimeModels
      .entertainment
      .list();

    logger.log('info', JSON.stringify(entertainment, null, 4));
    await models.activity.addUpdateActivities(entertainment);
  } catch (e) {
    logger.log('error', e);
  }

  try {
    const dining = await realtimeModels
    .dining
    .list({ max: 5 });
    logger.log('info', JSON.stringify(dining, null, 4));
  } catch (e) {
    logger.log('error', e);
  }
};
