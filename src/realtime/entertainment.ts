import cheerio from 'cheerio';
import { ILogger, ISchedules } from '../types';
import { getAccessToken, getWebApi, screen } from './api/request';
import { parseExternal, parseLocation } from './utils';

const path = 'https://disneyworld.disney.go.com/entertainment/';

const ageKeys = ['All Ages', 'Preschoolers', 'Kids', 'Tweens', 'Teens', 'Adults'];
const NO_WHEELCHAIR_TRANSFER = 'May Remain in Wheelchair/ECV';
const ADMISSION_REQUIRED = 'Valid Park Admission Required';

/**
 * Retrieves detailed information about an entertainment activity, internal for processing list.
 * @param {string} url
 */
const get = async item => {
  const response = await screen(item.url);

  const $ = cheerio(response);
  const $page = $.find('#pageContent');
  const $restrictions = $page
    .find('.moreDetailsInfo .modalContainer .moreDetailsModal-accessibility');
  const wheelchairTransfer = $restrictions
    .find('.moreDetailsModalItem-wheelchair-access')
    .text()
    .trim() !== NO_WHEELCHAIR_TRANSFER;
  const admissionRequired = $page.find('.themeParkAdmission').text().trim() === ADMISSION_REQUIRED;
  const description = $page.find('.finderDetailsPageSubtitle').text().trim();
  // <li class="moreDetailsModalItem-audio-description">Audio Description</li>
  // <li class="moreDetailsModalItem-sign-language">Sign Language</li>
  // <li class="moreDetailsModalItem-handheld-captioning">Handheld Captioning</li>
  // <li class="moreDetailsModalItem-assistive-listening">Assistive Listening</li>

  // TODO: add length if it exists
  return {
    admissionRequired,
    description,
    wheelchairTransfer
  };
};

/**
 * Reloads cached data.
 */
export const list = async (logger: ILogger, options: { max?: number} = {}) => {
  logger('info', `Grabbing screen for ${path}.`);
  const response = await screen(path);

  const $ = cheerio(response);
  const $attractionCards = $.find('li.card');

  logger('info', `Total of ${$attractionCards.length} entertainment to process.`);

  const items: any = [];
  for (let i = 0; i < (options.max || $attractionCards.length); i += 1) {
    const card = $attractionCards.get(i);
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
    if (!type) {
      return undefined;
    }

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

    const $description = $card.find('.descriptionLines');
    const $facets = $description.find('.facets');
    const facets = $facets
      .first()
      .text()
      .split(',')
      .filter(detail => detail !== '')
      .map(detail => detail.trim()) || [];

    const ages: string[] = [];
    const tags: string[] = [];
    facets.forEach(detail => {
      if (ageKeys.includes(detail)) {
        ages.push(detail);
      } else {
        tags.push(detail);
      }
    });

    items.push({
      ages,
      area,
      extId,
      extRefName,
      location,
      name,
      tags,
      type,
      url
    });
  }

  logger('info', `Retrieving additional data of ${items.length}.`);

  // We are getting a lot of data here, so lets play nice with them and call them
  // one at a time instead of blasting the server
  const modifiedItems: any[] = [];
  for (const item of items) {
    const diningItem = await get(item);
    if (typeof diningItem === 'object') {
      modifiedItems.push({
        ...item,
        ...diningItem
      });
    } else {
      modifiedItems.push(item);
    }
  }

  return modifiedItems;
};

/**
 * Retrieves the schedules for all of the entertainment for a given day.  Returns them
 * by activity extId.
 *
 * @param start
 * @param end
 */
export const schedule = async(start: string)
: Promise<ISchedules[]> => {
  const data = {
    date: start,
    filters: 'Entertainment',
    region: 'US',
    scheduleOnly: true
  };

  const auth = await getAccessToken();
  const response: { results: any[] } =
    await getWebApi('https://disneyworld.disney.go.com/entertainment/', data, auth);

  const activitySchedules = response.results.reduce(
    (filtered, activity) => {
      if (!activity.schedule) {
        return filtered;
      }
      return [
        ...filtered,
        {
          id: activity.id,
          schedule: {
            [start]: activity.schedule.schedules.map(s => ({
              closing: s.endTime,
              isSpecialHours: false,
              opening: s.startTime,
              type: s.type
            }))
          }
        }
      ];
    },
    []
  );

  return activitySchedules;
};
