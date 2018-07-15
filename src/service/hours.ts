import moment from 'moment';
import model from '../park';
import { hours } from '../realtime/parks';

/**
 * Service for updating hours
 */
export default async (days?: number) => {
  const startDate = moment().format('YYYY-MM-DD');
  const endDate = days ? moment().add(days, 'days').format('YYYY-MM-DD') : startDate;
  const parks = await model.getAll();
  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        if (park.retrieveHours === false) {
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
    // console.log(JSON.stringify(parkSchedule, null, 4));
    // TODO this is not going to work right now because of how we are reading/wrting the files
    await model.addSchedule(parkSchedule.id, parkSchedule.schedule);
  }

  return responses;
};
