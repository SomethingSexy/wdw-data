import cheerio from 'cheerio';
import createDebug from 'debug';
import invariant from 'invariant';
import { ILogger } from '../types';
import { diningFinder, getWebSession, screen } from './api/request';
import { parseExternal, parseLocation } from './utils';

const debug = createDebug('dining');

const VALID_ADMISSION_REQUIRED = 'Valid Park Admission Required';
const CUISINE_LABEL = 'Cuisine';
const QUICK_SERVICE = 'Quick Service';
const DINING_EVENT = 'Dining Event';
const TABLE_SERVICE = 'Table Service';

const path = 'https://disneyworld.disney.go.com/dining/';

export const get = async (extId: string, url: string, logger: ILogger): Promise<{} | null> => {
  if (!url) {
    // if it doesn't have a url, don't bother getting anything for now other than super basics
    logger('info', `No url for dining ${extId}, cannot get details.`);
    return null;
  }

  logger('info', `Getting screen for ${url}.`);
  try {
    const response = await screen(url);
    logger('info', `Grabbed screen for ${url} with length ${response.length}.`);
    const $ = cheerio(response);
    const $rightBarInfo = $.find('.atAGlance');
    const rawCostDescription = $rightBarInfo.find('.diningPriceInfo h3').text();
    const costDescription = rawCostDescription
      .substring(0, rawCostDescription.indexOf(')') + 1)
      .trim();

    const rawAdmissionRequired = $rightBarInfo.find('.themeParkAdmission').text().trim();
    const admissionRequired = rawAdmissionRequired === VALID_ADMISSION_REQUIRED;

    const rawCuisine = $rightBarInfo.find('.diningInfo h3').text().trim();
    let cuisine: string[] | null = null;
    if (rawCuisine) {
      cuisine = rawCuisine
        .split(',')
        .map(text => text.replace(CUISINE_LABEL, '').trim());
    }

    const rawTags = $rightBarInfo.find('.diningInfo p').text().trim();
    let tags: string[] | null = null;
    if (rawTags) {
      tags = rawTags
        .split(',')
        .map(text => text.trim());
    }

    // main contents
    // const $mainContent = $.find('.finderDetailsHeaderContent');
    const rawDescription = $.find('.finderDetailsPageSubtitle').text().trim();
    const description = rawDescription || null;

    // TODO: Hours (only if not in park?), menu, handle things like seminars
    logger('info', `Finished processing data for ${url}.`);
    return {
      admissionRequired,
      costDescription,
      cuisine,
      description,
      tags
    };
  } catch (error) {
    logger('error', `Failed to get screen or process screen for ${url} - ${error}`);
  }

  return null;
};

/**
 * Return a list of all dining options.
 */
export const list = async (logger: ILogger, options: { max?: number} = {}) => {
  logger('info', `Grabbing screen for ${path}.`);
  const response = await screen(path);

  const $ = cheerio(response);
  const $diningCards = $.find('li.card');

  logger('info', `Total of ${$diningCards.length} to process.`);

  const items: any = [];
  for (let i = 0; i < (options.max || $diningCards.length); i += 1) {
    const card = $diningCards.get(i);
    let location = null;
    let area = null;
    let type;
    let extId;
    let extRefName;
    let quickService = false;
    let tableService = false;
    let diningEvent = false;
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

    const rawTypes = $card.find('.itemInfo').find('.metaInfo').find('.serviceType').text().trim();
    if (rawTypes) {
      const types = rawTypes.split(',').map(t => t.trim());
      quickService = types.includes(QUICK_SERVICE);
      tableService = types.includes(TABLE_SERVICE);
      diningEvent = types.includes(DINING_EVENT);
    }

    items.push({
      area,
      diningEvent,
      extId,
      extRefName,
      location,
      name,
      quickService,
      tableService,
      type,
      url
    });
  }

  logger('info', `Retrieving additional data of ${items.length}.`);

  // We are getting a lot of data here, so lets play nice with them and call them
  // one at a time instead of blasting the server
  const modifiedItems: any[] = [];
  for (const item of items) {
    const diningItem = await get(item.extId, item.url, logger);
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
 * Retrieves available reservations for a restaurant.
 *
 * TODO: Add support for multiple.
 *
 */
export const reservations = async (
  dining: { id: string, url: string },
  date: string,
  time: string,
  size: number
) => {
  invariant(dining, 'Dining object is required when checking reservations.');
  invariant(date, 'Date is required when checking reservations.');
  invariant(time, 'Time is required when checking reservations.');
  invariant(size, 'Party size is required when checking reservations.');

  debug('Running reservation call');
  let localTime;
  if (time === 'dinner') {
    localTime = '80000714';
  } else if (time === 'lunch') {
    localTime = '80000717';
  } else if (time === 'breakfast') {
    localTime = '80000712';
  } else {
    localTime = time;
  }

  const postData = {
    id: dining.id,
    partySize: size,
    searchDate: date,
    searchTime: localTime,
    skipPricing: true,
    type: 'dining'
  };

  const auth = await getWebSession(dining.url);
  return diningFinder(
    dining.url,
    postData,
    auth
  );
};
