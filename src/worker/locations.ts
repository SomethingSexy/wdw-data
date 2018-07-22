import data from '../data/index';
import { list as listHotels } from '../realtime/hotels';
import { list as listParks } from '../realtime/parks';

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

  const hotels = await runHotels();
  // console.log(hotels);

  // update the database
  await models.addUpdateParks(parks);
  await models.addUpdateHotels(hotels);
};
