import moment from 'moment';
import 'moment-holiday';
import data from '../data/index';
import { hours } from '../realtime/parks';

/**
 * Service for updating hours
 */
export default async (days?: number) => {
  // setup our database connection
  const models = data();

  const startDate = moment().format('YYYY-MM-DD');
  const endDate = days ? moment().add(days, 'days').format('YYYY-MM-DD') : startDate;
  const parks = await models.location.listAllParks();
  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        // TODO: certain parks with this type cannot get hours
        if (park.type === 'entertainment-venue') {
          return all;
        }
        return [
          ...all,
          hours(park, startDate, endDate)
            .then(schedule => ({ schedule, id: park.id }))
        ];
      },
      []
    )
  );

  for (const parkSchedule of responses) {
    await models.location.addParkSchedules(
      parkSchedule.id,
      parkSchedule.schedule
    );
  }

  // TODO: Need to get schedule for activities/entertainment

  return responses;
};
