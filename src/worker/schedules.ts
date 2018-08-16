import moment from 'moment';
import 'moment-holiday';
import data from '../data/index';
import { schedule } from '../realtime/entertainment';
import { parkHours } from '../realtime/parks';
/**
 * Service for updating hours
 */
export default async (days?: number) => {
  // setup our database connection
  const models = await data();

  const startDate = moment().format('YYYY-MM-DD');
  const endDate = days ? moment().add(days, 'days').format('YYYY-MM-DD') : startDate;
  const parks = await models.location.list({ fetchSchedule: true });
  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        return [
          ...all,
          parkHours(park, startDate, endDate)
            .then(p => ({ ...p, id: park.id }))
        ];
      },
      []
    )
  );

  // console.log('parks', responses);
  for (const parkSchedule of responses) {
    await models.location.addParkSchedules(
      parkSchedule.id,
      parkSchedule.schedule
    );
  }

  // get all activities that can fetch schedules
  const entertainment = await models.activity.list({ fetchSchedule: true });
  console.log('retrieving entertainment schedules');
  let entertainmentSchedules: any[] = await schedule(startDate);
  console.log('retrieved entertainment schedules');
  entertainmentSchedules = entertainmentSchedules
    .reduce(
      (all, eS) => {
        const found = entertainment.find(e => e.extId === eS.id);
        if (!found) {
          return all;
        }

        return [
          ...all,
          { ...eS, id: found.id }
        ];
      },
      []
    );

  for (const entertainmentSchedule of entertainmentSchedules) {
    console.log('Adding schedule to database');
    await models.activity.addSchedules(
      entertainmentSchedule.id,
      entertainmentSchedule.schedule
    );
  }
  return null;
};
