import moment from 'moment';
import 'moment-holiday';
import { createModels, realtime } from '../index';
import logger from '../log';
/**
 * Service for updating hours
 */
export default async (days?: number) => {
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

  const startDate = moment().format('YYYY-MM-DD');
  const endDate = days ? moment().add(days, 'days').format('YYYY-MM-DD') : startDate;
  // fetch all locations that can add schedules
  const parks = await models.park.findAll({ fetchSchedule: true });
  const responses: any[] = await Promise.all(
    parks.reduce(
      (all: any[], park) => {
        return [
          ...all,
          realtimeModels.parks.hours(park.data, startDate, endDate)
            .then(p => ({ ...p, id: park.data.id }))
        ];
      },
      []
    )
  );

  // loop through all of the locations, find if there is a schedule then add it
  for (const park of parks) {
    const parkSchedule = responses.find(response => response.id === park.data.id);
    if (parkSchedule) {
      await park.bulkAddSchedules(
        parkSchedule.schedule
      );
    }
  }

  // get all activities that can fetch schedules
  const entertainment = await models.activity.findAll({ fetchSchedule: true });

  logger.log('info', 'retrieving entertainment schedules');
  let entertainmentSchedules: any[] = await realtimeModels.entertainment.schedule(startDate);
  logger.log('info', 'retrieved entertainment schedules');

  entertainmentSchedules = entertainmentSchedules
    .reduce(
      (all, eS) => {
        const found = entertainment.find(e => e.data.extId === eS.id);
        if (!found) {
          return all;
        }

        return [
          ...all,
          { ...eS, id: found.data.id }
        ];
      },
      []
    );

  for (const activity of entertainment) {
    logger.log('info', 'Adding schedule to database');
    const activitySchedule = entertainmentSchedules
      .find(response => response.id === activity.data.id);
    if (activitySchedule) {
      await activity.bulkAddSchedules(
        activitySchedule.schedule
      );
    }
  }
  return null;
};
