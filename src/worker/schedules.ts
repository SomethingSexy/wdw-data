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
  const parks = await models.location.list({ fetchSchedule: true });
  const responses: any[] = await Promise.all(
    parks.reduce(
      (all, park) => {
        return [
          ...all,
          realtimeModels.parks.hours(park, startDate, endDate)
            .then(p => ({ ...p, id: park.id }))
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

  // get all activities that can fetch schedules
  const entertainment = await models.activity.list({ fetchSchedule: true });

  logger.log('info', 'retrieving entertainment schedules');
  let entertainmentSchedules: any[] = await realtimeModels.entertainment.schedule(startDate);
  logger.log('info', 'retrieved entertainment schedules');

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
    logger.log('info', 'Adding schedule to database');
    await models.activity.addSchedules(
      entertainmentSchedule.id,
      entertainmentSchedule.schedule
    );
  }
  return null;
};
