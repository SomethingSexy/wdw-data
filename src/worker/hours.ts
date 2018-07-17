import moment from 'moment';
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
  const parks = await models.listAllParks();
  console.log(parks);
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

  // for (const parkSchedule of responses) {
  //   // console.log(JSON.stringify(parkSchedule, null, 4));
  //   // TODO this is not going to work right now because of how we are reading/wrting the files
  //   await model.addSchedule(parkSchedule.id, parkSchedule.schedule);
  // }

  const date = {
    date: '2018-07-16',
    isHoliday: false
  };

  await models.addParkSchedules(date, []);

  return responses;
};
