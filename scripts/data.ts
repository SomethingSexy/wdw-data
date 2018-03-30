import { writeJsonSync } from 'fs-extra';
import { uniq } from 'lodash';
import { v4 } from 'uuid';
import parks from '../src/data/parks';
import { attractions, dining } from '../src/index';
import { IAttraction, IDining, IPlace } from '../src/types';

// Fetch all data, group together and save

const runDining = () => {
  return dining.list().then((results: any) => {
    return results;
  });
};

const runAttractions = () => {
  return attractions.list().then((results: any) => {
    return results;
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
  let places: IPlace[] = parks
    .concat(
      fetchedDining
        .map((place: IDining) => {
          return {
            ...place,
            extId: place.id,
            id: v4()
          };
        })
    )
    .concat(
      fetchedAttractions
        .map((place: IAttraction) => {
          return {
            ...place,
            extId: place.id,
            id: v4()
          };
        })
    );

  // build locations from the data set
  let locations = uniq(
    places
      .map(place => place.location)
      .filter(location => location !== '')
  )
    .reduce(
      (all, location) => {
        const [main, area] = location.split(',');
        const existing = all[main];

        const toMerge = {
          ...existing,
          name: main
        };

        if (!existing) {
          toMerge.id = v4();
        }

        if (area) {
          toMerge.areas = existing && existing.areas ? existing.areas.concat(area) : [area];
        }

        return {
          ...all,
          [main]: toMerge
        };
      },
      {});

  places = places.map(place => {
    if (!place.location) {
      return place;
    }
    const [main] = place.location.split(',');
    return {
      ...place,
      location: locations[main].id
    };
  });

  locations = Object.values(locations);

  writeJsonSync('./src/data/locations.json', locations);
  writeJsonSync('./src/data/places.json', places);

  process.exit();
});
