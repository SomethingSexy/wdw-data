import { writeJsonSync } from 'fs-extra';
import { v4 as uuid } from 'uuid';
import parks from '../src/data/parks';
import { attractions, dining } from '../src/index';
import { IAttraction, IDining, IPlace } from '../src/types';

// Fetch all data, group together and save

const runDining = () => {
  return dining.list().then((results: any) => {
    return results;
    // writeJsonSync('./src/data/dining.json', results);
  });
};

const runAttractions = () => {
  return attractions.list().then((results: any) => {
    return results;
    // writeJsonSync('./src/data/attractions.json', results);
  });
};

// const runHours = () => {
//   return hours.list().then((results: any) => {
//     writeJsonSync('./src/data/hours.json', results);
//   });
// };

Promise.all(
  [runDining(), runAttractions()]
).then(([fetchedDining = [], fetchedAttractions = []]) => {
  // start with parks and then add
  const places: IPlace[] = parks
    .concat(
      fetchedDining
        .map((place: IDining) => {
          return {
            ...place,
            extId: place.id,
            id: uuid()
          };
        })
    )
    .concat(
      fetchedAttractions
        .map((place: IAttraction) => {
          return {
            ...place,
            extId: place.id,
            id: uuid()
          };
        })
    );

  writeJsonSync('./src/data/places.json', places);

  process.exit();
});
