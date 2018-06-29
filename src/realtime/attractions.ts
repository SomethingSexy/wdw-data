import * as cheerio from 'cheerio';
import api from './api';
import { parseLocation } from './utils';

const attractionsPath = 'https://disneyworld.disney.go.com/attractions/';
/**
 * Reloads cached data.
 */
export const list = async () => {
  const response = await api(attractionsPath);

  const $ = cheerio(response);
  const attractions = $.find('li.card').map(({}, card) => {
    const $card = cheerio(card);
    const id = $card.attr('data-entityid');
    const type = new RegExp(/\d+;entityType=(\w+)/, 'g').exec(id);
    const fullLocation = parseLocation($card.find('span[aria-label=location]').text());
    let location;
    let area;
    if (fullLocation) {
      location = fullLocation.location;
      area = fullLocation.area;
    }

    return {
      area,
      id,
      location,
      name: $card.find('.cardName').text(),
      type: type ? type[1].toLowerCase() : ''
    };
  }).get();

  // TODO: Get character experiences as well

  return attractions;
};
