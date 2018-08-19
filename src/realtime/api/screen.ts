import cheerio from 'cheerio';
import { IScreenItem } from '../../types';
import { parseExternal, parseLocation } from '../utils';
import { screen } from './request';

export type GetItemsCallback = ($: any, item: {}) => Promise<{}>;

const delay = ms => new Promise(_ => setTimeout(_, ms));

export const grab = async path => {
  const response = await screen(path);
  const $ = cheerio(response);
  return {
    /**
     * Returns an array of screen cards.
     */
    getItems: async (callback?: GetItemsCallback): Promise<IScreenItem[]> => {
      const $cards = $.find('li.card');
      console.log('Total of ', $cards.length);
      const items: any = [];
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

      let modifiedItems;
      if (callback) {
        modifiedItems = [];
        // if there are callbacks, lets run them in order and wait on each one.
        // Most of the time these callbacks are making additional calls to screens
        // and we should play nice.
        for (const item of items) {
          const additional = await callback(item.$card, item.item);
          if (additional) {
            modifiedItems.push({
              ...item,
              item: {
                ...item.item,
                ...additional
              }
            });
          }

          modifiedItems.push(item);
        }
      }
      console.log('done');
      return (modifiedItems || items).map(item => item.item);
    },
    html: () => {
      return $;
    }
  };
};
