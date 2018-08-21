import moment from 'moment';
import 'moment-holiday';
import { createModels, realtime } from '../index';
import logger from '../log';

/**
 * Service for updating hours
 */
export default async () => {
  // setup our database connection
  const models = await createModels(
    {
      database: 'wdw',
      logging: true,
      pool: {
        max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
      },
      username: 'tylercvetan',
    },
    logger
  );

  const realtimeModels = realtime(logger);

  const parks = await models.location.list();
  // save the same timestamp for all
  const timeStamp = moment.utc().format();

  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        return [
          ...all,
          realtimeModels.parks.waitTimes(park)
        ];
      },
      []
    )
  );

  for (const waitTime of responses) {
    await models.activity.addWaitTimes(
      timeStamp,
      waitTime
    );
  }

  return responses;
};
