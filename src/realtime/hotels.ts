import cheerio from 'cheerio';
import parseAddress from 'parse-address';
import { grab } from './api/screen';

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

// CLub access or club level
const CLUB = ['Club Level Access', 'Club Level', 'Atrium Club Level'];

// Additional tags
const PREFERRED = ['Preferred'];
const VALUE = ['Value'];
const CAMPSITE = ['Campsite'];
const DELUXE = ['Deluxe'];
const STUDIO = ['Studio'];
const VILLIA = ['Villa'];

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
            return total + Number.parseInt(n);
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

  return Number.parseInt(counts[0]);
};

/**
 * Retrieves detailed information about a hotel, internal for processing list.
 * @param {string} url
 */
const details = async ({}, item) => {
  // need to massage url here
  const url = item.url.substring(0, item.url.indexOf('/rates-rooms/'));
  const extRefName = url.substring(path.length, url.length);

  const screen = await grab(url);

  const $ = screen.html();
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
    url,
    address: parseAddress.parseLocation(`${addressLineOne}, ${addressRest} `) // tslint:disable-line
  };

  // grab room information now
  const roomsScreem = await grab(item.url);
  const rooms = roomsScreem
    .html()
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

  return {
    ...hotel,
    rooms
  };
};

export const list = async () => {
  const screen = await grab(path);

  return screen.getItems(details);
};
