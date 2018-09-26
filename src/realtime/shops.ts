import cheerio from 'cheerio';
import { IDiscount, ILogger, IShop } from '../types';
import { getHtml, screen } from './api/request';
import { parseExternal, parseLocation } from './utils';

const path = 'https://disneyworld.disney.go.com/shops/';
const passholderDiscountPath = 'https://disneyworld.disney.go.com/passholder-program/passholder-benefits-and-discounts/merchandise-discounts/'; // tslint:disable-line

const NO_WHEELCHAIR_TRANSFER = 'May Remain in Wheelchair/ECV';
const ADMISSION_REQUIRED = 'Valid Park Admission Required';

const addDiscount = (item: IShop, itemDiscount: IDiscount) => {
  const { description, discount, type } = itemDiscount;
  if (!item.discounts) {
    return {
      ...item,
      discounts: [{ description, discount, type }]
    };
  }

  return {
    ...item,
    discounts: [
      ...item.discounts,
      { description, discount, type }
    ]
  };
};

/**
 * Retrieves detailed information about a shop, internal for processing list.
 * @param {string} url
 */
const get = async (item, logger: ILogger) => {
  try {
    if (!item.url) {
      return null;
    }
    logger('info', `Getting screen for ${item.url}.`);
    const response = await screen(item.url);
    logger('info', `Grabbed screen for ${item.url} with length ${response.length}.`);
    const $ = cheerio(response);
    const $page = $.find('#pageContent');
    const $restrictions = $page
      .find('.moreDetailsInfo .modalContainer .moreDetailsModal-accessibility');
    const wheelchairAccessible = $restrictions
      .find('.moreDetailsModalItem-wheelchair-access')
      .text()
      .trim() !== NO_WHEELCHAIR_TRANSFER;
    const admissionRequired =
      $page.find('.themeParkAdmission').text().trim() === ADMISSION_REQUIRED;
    const description = $page.find('.finderDetailsPageSubtitle').text().trim();

    return {
      admissionRequired,
      description,
      wheelchairAccessible
    };
  } catch (error) {
    logger('error', `Failed to get screen or process screen for ${item.url} - ${error}`);
  }

  return null;
};

/**
 * Retrieves passholder discount information.  TODO: Move this to a common spot, we will need it
 * for dining.
 *
 * @param logger
 */
const getPassholderDiscounts = async (
  logger: ILogger
): Promise<{[name: string]: IDiscount} | null> => {
  logger('info', 'Grabbing passholder discounts.');
  const response = await getHtml(passholderDiscountPath);
  logger('debug', `Discount response length ${response.length}`);
  const $ = cheerio.load(response);
  const $body = $('body');
  const $table = $body.find('#offer-table');
  // if we cannot find the table, then return null to indicate bad request
  if (!$table.length) {
    logger('error', 'Request did not return the correct html for us to process the discounts.');
    return null;
  }
  const $discountRows = $table.find('tr.row.show');
  logger('info', `Found ${$discountRows.length} discounts.`);
  const items: any[] = [];
  for (let i = 0; i < $discountRows.length; i += 1) {
    const row = $discountRows.get(i);

    const $row = cheerio(row);

    const $contentName = $row.find('td.name .cellWrapper .content');
    const $anchor = $contentName.find('a');
        // if anchor doesn't exist, grab text directly from content
    const name = $anchor.length ? $contentName.text() : $contentName.text();

    const $contentLocation = $row.find('td.location .cellWrapper .content');
    const location = $contentLocation.text();

    const $contentDiscount = $row.find('td.percent .cellWrapper .content');
    const discount = $contentDiscount.text();

    const $contentDescription = $row.find('td.valid .cellWrapper .content');
    const description = $contentDescription.text();

    items.push({
      description,
      discount,
      location,
      name,
      type: 'passholder'
    });
  }

  logger('info', `Grabbed ${items.length} discount items.`);
  return Object.values(items).reduce((all, item) => ({ ...all, [item.name]: item }), {});
};

/**
 * Retrieves all shops.
 */
export const list = async (
  logger: ILogger, options: { max?: number} = {}
): Promise<IShop[] | undefined> => {
  logger('info', `Grabbing screen for ${path}.`);
  const response = await screen(path);

  const $ = cheerio(response);
  const $shopCards = $.find('li.card');

  logger('info', `Total of ${$shopCards.length} shops to process.`);

  const items: any = [];
  for (let i = 0; i < (options.max || $shopCards.length); i += 1) {
    const card = $shopCards.get(i);
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
    // this will grab information about what type of stuff is sold at this shop
    const tags = $facets
      .first()
      .text()
      .split(',')
      .filter(detail => detail !== '')
      .map(detail => detail.trim()) || [];

    items.push({
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
  let modifiedItems: any[] = [];
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

  // Add in discounts, both passholder and visa card.  We can retrieve these
  // all once and then process them
  const passholderDiscounts = await getPassholderDiscounts(logger);

  if (passholderDiscounts) {
    modifiedItems = modifiedItems.map(item => {
      const discount = passholderDiscounts[item.name];
      if (passholderDiscounts[item.name]) {
        return addDiscount(item, discount);
      }

      return item;
    });
  }

  return modifiedItems;
};
