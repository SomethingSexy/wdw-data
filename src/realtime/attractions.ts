import { grab } from './api/screen';

const path = 'https://disneyworld.disney.go.com/attractions/';

/**
 * Reloads cached data.
 */
export const list = async () => {
  const screen = await grab(path);

  return screen.getItems($item => {
    const $description = $item.find('.descriptionLines');
    const $facets = $description.find('.facets');

    let heightRestriction = $facets.first().text() || null;
    heightRestriction = heightRestriction !== '' ? heightRestriction : null;

    if (heightRestriction) {
      const group = new RegExp(/Height: ([\w\d\s()]+)/, 'g').exec(heightRestriction);
      heightRestriction = group ? group[1] : null;
    }

    const details = $facets
      .last()
      .text()
      .split(',')
      .filter(detail => detail !== '')
      .map(detail => detail.trim());

    return {
      details,
      heightRestriction
    };
  });
};
