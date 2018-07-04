import createDebug from 'debug';
import invariant from 'invariant';
import { post, session } from './api/request';
import { grab } from './api/screen';

const debug = createDebug('dining');

const path = 'https://disneyworld.disney.go.com/dining/';

export const list = async () => {
  const screen = await grab(path);

  return screen.getItems($item => {
    const costCuisineInfo = $item.find('span[aria-label=facets]').text().split(',');
    const cost = costCuisineInfo.length === 2 ? costCuisineInfo[0].trim() : '';
    const cuisine = costCuisineInfo.length === 2 ? costCuisineInfo[1].trim() : '';
    const description = $item.find('span[aria-label="dining type"]').text();

    // TODO: Hours, reservations, menu
    return {
      cost,
      cuisine,
      description
    };
  });
};

/**
 * Retrieves available reservations for a resturante
 * 
 */
export const reservations = async (dining, date, time, size) => {
  invariant(date, 'Date is required when checking reservations.');
  invariant(time, 'Time is required when checking reservations.');
  invariant(size, 'Party size is required when checking reservations.');

  debug('Running reservation call');
  let localTime;
  if (time === 'dinner') {
    localTime = '80000714';
  } else if (time === 'lunch') {
    localTime = '80000717';
  } else if (time === 'breakfast') {
    localTime = '80000712';
  } else {
    localTime = time;
  }

  const postData = {
    searchDate: date,
    skipPricing: true,
    searchTime: localTime,
    partySize: size,
    id: dining.id,
    type: 'dining'
  };

  const auth = await session(dining.url);
  const response = await post(
    'https://disneyworld.disney.go.com/finder/dining-availability/',
    postData,
    dining.url,
    auth
  );

  console.log('fuck', response);
  return 'balls';
};
