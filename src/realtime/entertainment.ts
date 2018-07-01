import { grab } from './api/screen';
const path = 'https://disneyworld.disney.go.com/entertainment/';

/**
 * Reloads cached data.
 */
export const list = async () => {
  const screen = await grab(path);

  return screen.getItems($item => {
    const $description = $item.find('.descriptionLines');
    const $facets = $description.find('.facets');

    const details = $facets
      .first()
      .text()
      .split(',')
      .filter(detail => detail !== '')
      .map(detail => detail.trim());

    // TODO: Grab schedule from api, there is a separate call for this, doesn't exist on the
    // initial rendering of the screen.
    return { details };
  });
};
