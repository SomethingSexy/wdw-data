import * as cheerio from 'cheerio';
import { IHotel } from '../types';
import api from './api';

const hotelsPath = 'https://disneyworld.disney.go.com/resorts/';

/**
 * Retrieves detailed information about a hotel, use url for now until data is built up
 * @param {string} url
 */
export const get = async (url: string) => {
  const response = await api(`${hotelsPath}/${url}`);

  const $ = cheerio(response);
  const $page = $.find('.resortsPage');
  const name = $page.find('h1').text();
  const description = $page.find('.description').text();
  const $address = $page.find('.addressBlock');
  const addressLineOne = $address.find('.address1').text();
  const addressRest = $address.find('.cityStatePostalCode').text();
  const tier = $page.find('.resortTier').next().text();
  const area = $page.find('.resortArea').next().text();

  return {
    area,
    description,
    name,
    tier,
    address: { // tslint:disable-line
      // TODO: break this out
      cityStateZip: addressRest,
      street: addressLineOne
    }
  };
};

export const list = async () => {
  const response = await api(hotelsPath);

  let hotels: any = [];
  // .each instead of .map because map().get() in Typescript forces string[]
  cheerio(response)
    .find('li.card')
    .each(({}, card) => {
      const $card = cheerio(card);
      const id = $card.attr('data-entityid');
      const entityType = new RegExp(/\d+;entityType=(\w+)/, 'g').exec(id);
      const type = entityType ? entityType[1].toLowerCase() : null;

      if (type) {
        let url = $card
          .find('.cardLinkOverlay')
          .attr('href');
        url = url.substring(0, url.indexOf('/rates-rooms/'));
        hotels.push({
          type,
          url,
          extId: id,  // tslint:disable-line
          extRefName: url.substring(hotelsPath.length, url.length)
        });
      }
    });

  // retrieve additional information about each hotel
  hotels = await Promise.all(hotels
    .map(async attraction => {
      const details = await get(attraction.extRefName);
      return {
        ...attraction,
        ...details
      };
    }));

  return hotels;
};
