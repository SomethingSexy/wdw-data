import * as cheerio from 'cheerio';
import { parseExternal, parseLocation } from '../utils';
import { screen } from './request';

export type GetItemsCallback = ($: any, item: {}) => {};

export const grab = async path => {
  const response = await screen(path);
  const $ = cheerio(response);
  const $cards = $.find('li.card');
  return {
    getItems: async (callback?: GetItemsCallback)  => {
      let items: any = [];
      // .each instead of .map because map().get() in Typescript forces string[]
      $cards.each(({}, card) => {
        let location;
        let area;
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

        const fullLocation = parseLocation($card.find('span[aria-label=location]').text());
        if (fullLocation) {
          location = fullLocation.location;
          area = fullLocation.area;
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

        items.push({
          $card,
          item: {
            area,
            extId,
            extRefName,
            location,
            name,
            type,
            url
          }
        });
      });

      if (callback) {
        items = await Promise.all(items
          .map(async item => {
            const additional = await callback(item.$card, item.item);
            if (additional) {
              return {
                ...item,
                item: {
                  ...item.item,
                  ...additional
                }
              };
            }

            return item;
          }));
      }

      return items.map(item => item.item);
    },
    html: () => {
      return $;
    }
  };
};
