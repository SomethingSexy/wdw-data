import cheerio from 'cheerio';
import parseAddress from 'parse-address';
import { ILogger } from '../types';
import { screen } from './api/request';
import { parseExternal, parseLocation } from './utils';

const path = 'https://disneyworld.disney.go.com/resorts/';

// Views
const STANDARD = ['Standard Room', 'Standard View'];
const GARDEN = ['Garden View', 'Woods View'];
const POOL = ['Pool View'];
const WATER = ['River View', 'Lake View', 'Water View', 'Lagoon View', 'Marina View'];
const THEME_PARK = ['Theme Park View'];

interface IView {
  id: string;
  values: string[];
}

const VIEWS = [
  { values: STANDARD, id: 'standard' },
  { values: GARDEN, id: 'garden' },
  { values: POOL, id: 'pool' },
  { values: WATER, id: 'water' },
  { values: THEME_PARK, id: 'themePark' }
];

// TODO: Need to finish this
// CLub access or club level
// const CLUB = ['Club Level Access', 'Club Level', 'Atrium Club Level'];

// Additional tags
// const PREFERRED = ['Preferred'];
// const VALUE = ['Value'];
// const CAMPSITE = ['Campsite'];
// const DELUXE = ['Deluxe'];
// const STUDIO = ['Studio'];
// const VILLIA = ['Villa'];

const additionalData = {
  '80010383;entityType=resort': {
    busStops: [
      'Congress Park',
      'The Carousel',
      'The Grandstand',
      'The Paddock',
      'The Springs'
    ]
  },
  '80010387;entityType=resort': {
    busStops: [
      'Hospitality House',
      "Miller's Road", // tslint:disable-line
      'Old Turtle Road',
      'Peninsular Road',
      'South Point Road'
    ]
  },
  '80010396;entityType=resort': {
    busStops: ['Cabanas', 'Casitas', 'El Centro', 'Ranchos']
  },
  '80010397;entityType=resort': {
    busStops: ['East Depot', 'Main Building', 'North Depot', 'West Depot']
  },
  '80010399;entityType=resort': {
    busStops: [
      'Aruba',
      'Jamacia',
      'Martinique',
      'Old Port Royale',
      'Trinidad North',
      'Trinidad South'
    ]
  }
};

const viewType = (name: string, config: IView[]) => {
  const found = config.find(viewConfig => {
    return !!viewConfig.values.find(view => {
      if (name.indexOf(view) !== -1) {
        return true;
      }

      return false;
    });
  });

  if (found) {
    return found.id;
  }

  return null;
};

/**
 * Returns an array of room configurations based on the description
 * of the beds.
 *
 * @param roomName
 */
const roomConfigurations = description => {
  if (!description) {
    return null;
  }
  // we can reasonably split on or to get the different configurations
  const raw = description.split('or');
  if (!raw.length) {
    return null;
  }

  return raw.reduce(
    (all, configuration) => {
      if (!configuration.length) {
        return all;
      }

      // set to null, incase we have a configuration but cannot
      // figure out how many beds
      let count = null;
      const counts = configuration.match(/\d/g);
      if (counts.length) {
        count = counts.reduce(
          (total, n) => {
            return total + Number.parseInt(n, 10);
          },
          0
        );
      }

      return [
        ...all,
        {
          count,
          description: configuration.trim()
        }
      ];
    },
    []
  );
};

const totalOccupancy = description => {
  if (!description) {
    return null;
  }

  const counts = description.match(/\d/g);
  if (!counts) {
    return null;
  }

  if (!counts.length) {
    return null;
  }

  return Number.parseInt(counts[0], 10);
};

/**
 * Retrieves detailed information about a hotel, internal for processing list.
 * @param {object} url
 */
const get = async ({ url, extId }, logger) => {
  if (!url) {
    // if it doesn't have a url, don't bother getting anything for now other than super basics
    logger('info', `No url for hotel ${extId}, cannot get details.`);
    return null;
  }

  // need to massage url here
  const fetchUrl = url.substring(0, url.indexOf('rates-rooms/'));
  const extRefName = fetchUrl.substring(path.length, fetchUrl.length);

  logger('info', `Getting screen for ${fetchUrl}`);
  const response = await screen(fetchUrl);
  logger('info', `Grabbed screen for ${fetchUrl} with length ${response.length}.`);

  // TODO: check if we did not get the correct HTML back, if so, fail the request then
  // we only want to update when we get good data.
  const $ = cheerio(response);
  const $page = $.find('.resortsPage');
  const name = $page.find('h1').text();
  const description = $page.find('.description').text().trim();
  const $address = $page.find('.addressBlock');
  const addressLineOne = $address.find('.address1').text();
  const addressRest = $address.find('.cityStatePostalCode').text();
  const tier = $page.find('.resortTier').next().text();
  const area = $page.find('.resortArea').next().text();

  const hotel = {
    area,
    description,
    extRefName,
    name,
    tier,
    url: fetchUrl,
    address: parseAddress.parseLocation(`${addressLineOne}, ${addressRest} `) // tslint:disable-line
  };

  // grab room information now
  const roomsScreem = await screen(url);
  const rooms = cheerio(roomsScreem)
    .find('.roomType')
    .map(({}, el) => {
      const $room = cheerio(el);
      const link = $room.find('.seasonalPricingLink.clear.preSearch').find('a');
      const linkData = link.data('plugins');
      let requestUrl;
      if (Array.isArray(linkData) && Array.isArray(linkData[0]) && linkData[0][1]) {
        requestUrl = linkData[0][1].ajaxUrl;
      }
      const roomName = $room.find('.cardName').text();
      const bedsDescription = $room.find('.bedTypes').text();
      const occupancyDescription = $room.find('.occupancy').text();
      // find the view type based on the name
      const view = viewType(roomName, VIEWS);
      const configurations = roomConfigurations(bedsDescription);
      const occupancy = totalOccupancy(occupancyDescription);

      return {
        bedsDescription,
        configurations,
        occupancy,
        occupancyDescription,
        view,
        description: $room.find('.description').text(), // tslint:disable-line
        extId: `${$room.data('roomtype')}`,
        name: roomName,
        pricingUrl: requestUrl
      };
    }).get();

  logger('info', `Finished processing data for screen for ${fetchUrl}.`);

  return {
    ...hotel,
    rooms
  };
};

export const list = async (logger: ILogger) => {
  logger('info', `Grabbing hotels screen for ${path}.`);
  const response = await screen(path);

  const $ = cheerio(response);
  const $diningCards = $.find('li.card');

  logger('info', `Total of ${$diningCards.length} hotels to process.`);

  const items: any = [];
  for (let i = 0; i < $diningCards.length; i += 1) {
    const card = $diningCards.get(i);
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

    if (type) {
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

      const localData = additionalData[extId] ? additionalData[extId] : {};

      items.push({
        ...localData,
        area,
        extId,
        extRefName,
        location,
        name,
        type,
        url
      });
    }
  }

  logger('info', `Retrieving additional data of ${items.length}.`);

  // We are getting a lot of data here, so lets play nice with them and call them
  // one at a time instead of blasting the server
  const modifiedItems: any[] = [];
  for (const item of items) {
    const diningItem = await get(item, logger);
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
