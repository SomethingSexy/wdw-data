import invariant from 'invariant';
import moment from 'moment';
import { get, getAccessToken } from './api/request';
import { grab } from './api/screen';
import { parseExternal } from './utils';

const DESTINATION_ID = 80007798;
const path = 'https://disneyworld.disney.go.com/destinations/';
const PARK_REGION = 'us';
const TIME_ZONE = 'America/New_York';

export const list = async () => {
  const screen = await grab(path);

  return screen.getItems();
};

export const hours = async(park: { extId: string }, start: string, end?: string) => {
  const parsed = parseExternal(park.extId);
  if (!parsed) {
    throw new Error('Cannot parse external id when trying to fetch wait times');
  }

  // TODO: validate YYYY-MM-DD

  const auth = await getAccessToken();

  const url =
    `/mobile-service/public/ancestor-activities-schedules/${park.extId};entityType=destination`;

  const data = {
    endDate: end || start,
    filters: 'theme-park',
    region: PARK_REGION,
    startDate: start
  };

  const response: any = await get(url, data, auth);
  // console.log(response.ancestor.schedule.schedules);
  invariant(response.activities, 'Issue parsing hours response.  Property activities is missing');

  const dates = response.activities.reduce(
    (all, activity) => {
      if (!activity.schedule) {
        return all;
      }

      const extId = activity.id;
      const { schedules, timeZone } = activity.schedule;
      return schedules.reduce(
        (byDate, schedule) => {
          const { date, endTime, startTime, type } = schedule;

          const dateSchedule = {
            date,
            type,
            closing: moment(`${date} ${endTime}`).utc().format(),
            opening: moment(`${date} ${startTime}`).utc().format(),
            specialHours: (type !== 'Operating' && type !== 'Closed' && type !== 'Refurbishment')
          };

          const updatedDate = !byDate[date]
            ? [dateSchedule] : [...byDate[schedule.date], dateSchedule];

          return {
            ...byDate,
            [schedule.date]: updatedDate
          };
        },
        {}
      );
    },
    {}
  );

  return dates;
};

export const waitTimes = async (park: { extId: string }) => {
  const parsed = parseExternal(park.extId);
  if (!parsed) {
    throw new Error('Cannot parse external id when trying to fetch wait times');
  }
  const url = `/facility-service/theme-parks/${parsed.id};destination=${DESTINATION_ID}/wait-times`;
  const auth = await getAccessToken();
  const response: any = await get(url, {}, auth);
  return response.entries.map(element => {
    return {
      extId: element.id,
      waitTime: element.waitTime
    };
  });
};
