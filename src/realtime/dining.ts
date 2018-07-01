import { grab } from './api/screen';

const path = 'https://disneyworld.disney.go.com/dining/';

export const list = async () => {
  const screen = await grab(path);

  return screen.getItems($item => {
    const costCuisineInfo = $item.find('span[aria-label=facets]').text().split(',');
    const cost = costCuisineInfo.length === 2 ? costCuisineInfo[0].trim() : '';
    const cuisine = costCuisineInfo.length === 2 ? costCuisineInfo[1].trim() : '';
    const description = $item.find('span[aria-label="dining type"]').text();

    return {
      cost,
      cuisine,
      description
    };
  });
};
