import data from '../data/index';
import { list as listAttractions } from '../realtime/attractions';
import { list as listEntertainment } from '../realtime/entertainment';
import { list as listHotels } from '../realtime/hotels';
import { list as listParks } from '../realtime/parks';

const runAttractions = async () => {
  return listAttractions().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

const runEntertainment = async () => {
  return listEntertainment().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

const runParks = async () => {
  return listParks().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

const runHotels = async () => {
  return listHotels().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

/**
 * A service for retrieving and persisting waitimes.
 */
export default async () => {
  // setup our database connection
  const models = data();

  // grab our realtime park data
  const parks = await runParks();
  await models.location.addUpdateParks(parks);

  const hotels = await runHotels();
  await models.location.addUpdateHotels(hotels);

  // grab our realtime park data
  const attractions = await runAttractions();
  await models.activity.addUpdateActivities(attractions);
  // TODO: Tours and events
  const entertainment = await runEntertainment();
  await models.activity.addUpdateActivities(entertainment);
};
