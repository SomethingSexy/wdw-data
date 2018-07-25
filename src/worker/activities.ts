import data from '../data/index';
import { list as listAttractions } from '../realtime/attractions';

const runAttractions = async () => {
  return listAttractions().then((results: any) => {
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
  const attractions = await runAttractions();

  // update the database
  await models.addUpdateActivities(attractions);
  // TODO: Entertainment, character meets, etc
};
