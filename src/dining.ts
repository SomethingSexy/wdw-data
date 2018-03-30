import * as cheerio from 'cheerio';
import 'fetch-everywhere';

export const list = async () => {
  const response = await fetch('https://disneyworld.disney.go.com/dining/', {
    headers: {
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.8',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Host: 'disneyworld.disney.go.com',
      Origin: 'https://disneyworld.disney.go.com',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.125 Safari/537.36' // tslint:disable-line
    },
    method: 'get'
  });

  const text = await response.text();
  const $ = cheerio(text);
  const dinning = $.find('li.card').map(({}, card) => {
    const $card = cheerio(card);
    const id = $card.attr('data-entityid');
    // const type = new RegExp(/\d+;entityType=(\w+)/, 'g').exec(id);
    return {
      id,
      location: $card.find('span[aria-label=location]').text(),
      name: $card.find('.cardName').text(),
      type: 'restaurant' // return them all as resturant for now
    };
  }).get();

  return dinning;
};
