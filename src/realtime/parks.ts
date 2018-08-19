import cheerio from 'cheerio';
import invariant from 'invariant';
import moment from 'moment';
import 'moment-holiday';
import { ILogger, ISchedules } from '../types';
import { get, getAccessToken , screen } from './api/request';
import { parseExternal, parseLocation } from './utils';

const DESTINATION_ID = 80007798;
const path = 'https://disneyworld.disney.go.com/destinations/';
const PARK_REGION = 'us';
// const TIME_ZONE = 'America/New_York';
// const DATE_FORMAT = 'YYYY-MM-DD';

export const list = async (logger: ILogger) => {
  logger('info', `Grabbing park screen for ${path}.`);
  const response = await screen(path);

  const $ = cheerio(response);
  const $parkCards = $.find('li.card');

  logger('info', `Total of ${$parkCards.length} to process.`);

  const items: any = [];
  for (let i = 0; i < $parkCards.length; i += 1) {
    const card = $parkCards.get(i);
    let location = null;
    let area = null;
    let type;
    let extId;
    let extRefName;

    const $card = cheerio(card);
    const external = $card.attr('data-entityid');
    const name = $card.find('.cardName').text();

    const parsedExternal = parseExternal(external);
    if (parsedExternal) {
      extId = parsedExternal.extId;
      type = parsedExternal.type;
    }
    // if (!type) {
    //   return undefined;
    // }

    const url = $card
      .find('.cardLinkOverlay')
      .attr('href');

    // not every place has a url, for example the California Grill Lounge
    if (url) {
      extRefName = url.substring(path.length, url.length);
      // depending on the url, might be additonal segements we need to remove
      extRefName = extRefName.substring(
        extRefName.indexOf('/') === extRefName.length - 1 ? 0 : extRefName.indexOf('/') + 1,
        extRefName.length - 1
      );
    }

    const fullLocation = parseLocation($card.find('span[aria-label=location]').text());
    if (fullLocation) {
      location = fullLocation.location;
      area = fullLocation.area;
    }

    items.push({
      area,
      extId,
      extRefName,
      location,
      name,
      type,
      url
    });
  }

  return items;
};

export const parkHours = async(park: { extId: string, type: string }, start: string, end?: string)
: Promise<ISchedules> => {
  const parsed = parseExternal(park.extId);
  if (!parsed) {
    throw new Error('Cannot parse external id when trying to fetch hours');
  }

  // TODO: validate YYYY-MM-DD
  const auth = await getAccessToken();

  const url =
    `/mobile-service/public/ancestor-activities-schedules/${park.extId}`;

  const data = {
    endDate: end || start,
    filters: park.type,
    region: PARK_REGION,
    startDate: start
  };

  const response: { activities: any[] } = await get(url, data, auth);
  // console.log(response.ancestor.schedule.schedules);
  invariant(
    response.activities,
    `Issue parsing hours response.  Property activities is missing for park ${park.extId}`
  );

  const dates = response.activities.reduce(
    (all, activity) => {
      if (!activity.schedule) {
        return all;
      }

      // const extId = activity.id;
      const { schedules } = activity.schedule;
      return schedules.reduce(
        (byDate, schedule) => {
          const { date, endTime, startTime, type } = schedule;
          const opening = moment(`${date} ${startTime}`);
          // type = 'Special Ticketed Event' might be early morning magic, or after hours magic
          const dateSchedule = {
            type,
            closing: moment(`${date} ${endTime}`).utc().format(), // tslint:disable-line
            isSpecialHours: (type !== 'Operating' && type !== 'Closed' && type !== 'Refurbishment'),
            opening: opening.utc().format(),
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

  return {
    id: park.extId,
    schedule: dates
  };
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
