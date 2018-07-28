import moment from 'moment';
import 'moment-holiday';
import data from '../data/index';
import { waitTimes } from '../realtime/parks';

/**
 * Service for updating hours
 */
export default async () => {
  // setup our database connection
  const models = data();

  const parks = await models.location.listAllParks();
  // save the same timestamp for all
  const timeStamp = moment.utc().format();

  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        return [
          ...all,
          waitTimes(park)
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
