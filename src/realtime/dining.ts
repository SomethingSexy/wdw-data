import * as cheerio from 'cheerio';
import api from './api';
import { parseLocation } from './utils';

const diningPath = 'https://disneyworld.disney.go.com/dining/';

export const list = async () => {
  const response = await api(diningPath);

  const $ = cheerio(response);
  const dinning = $.find('li.card').map(({}, card) => {
    const $card = cheerio(card);
    const id = $card.attr('data-entityid');
    const name = $card.find('.cardName').text();
    const type = new RegExp(/\d+;entityType=(\w+)/, 'g').exec(id);
    const costCuisineInfo = $card.find('span[aria-label=facets]').text().split(',');
    const cost = costCuisineInfo.length === 2 ? costCuisineInfo[0].trim() : '';
    const cuisine = costCuisineInfo.length === 2 ? costCuisineInfo[1].trim() : '';
    const fullLocation = parseLocation($card.find('span[aria-label=location]').text());
    let location;
    let area;
    if (fullLocation) {
      location = fullLocation.location;
      area = fullLocation.area;
    }

    return {
      area,
      cost,
      cuisine,
      id,
      location,
      name,
      type, // 'restaurant', // return them all as resturant for now
      description: $card.find('span[aria-label="dining type"]').text(), // tslint:disable-line
    };
  }).get();

  return dinning;
};
