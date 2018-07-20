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

  const parks = await models.listAllParks();
  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        // TODO: certain parks with this type cannot get wait times
        // if (park.type === 'entertainment-venue') {
        //   return all;
        // }

        return [
          ...all,
          waitTimes(park)
            .then(waitTimes => ({ waitTimes, id: park.id }))
        ];
      },
      []
    )
  );

  console.log(JSON.stringify(responses, null, 4));
  // for (const parkSchedule of responses) {
  //   await models.addParkSchedules(
  //     parkSchedule.id,
  //     parkSchedule.schedule
  //   );
  // }

  return responses;
};
