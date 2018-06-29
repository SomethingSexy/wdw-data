import { writeJsonSync } from 'fs-extra';
import { uniq } from 'lodash';
import { v4 } from 'uuid';
import parks from '../src/data/parks';
import * as attractions from '../src/realtime/attractions';
import * as dining from '../src/realtime/dining';
import * as hotels from '../src/realtime/hotels';
import { IAttraction, IDining, IPlace } from '../src/types';

// Fetch all data, group together and save

const runDining = () => {
  return dining.list().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

const runAttractions = () => {
  return attractions.list().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

const runHotels = () => {
  return hotels.list().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

// const runHours = () => {
//   return hours.list().then((results: any) => {
//     writeJsonSync('./src/data/hours.json', results);
//   });
// };

Promise.all(
  [runDining(), runAttractions(), runHotels()]
).then(([fetchedDining = [], fetchedAttractions = [], fetchedHotels = []]) => {
  // start with parks and then add
  const attractionsWithIds = fetchedAttractions
    .map((place: IAttraction) => {
      return {
        ...place,
        extId: place.id,
        id: v4()
      };
    });

  const diningWithIds = fetchedDining
    .map((place: IDining) => {
      return {
        ...place,
        extId: place.id,
        id: v4()
      };
    });

  const hotelsWithIds = fetchedHotels
    .map((place: any) => {
      return {
        ...place,
        extId: place.id,
        id: v4()
      };
    });

  let places: IPlace[] = parks
    .concat(diningWithIds)
    .concat(attractionsWithIds)
    .concat(hotelsWithIds);

  // build locations from the data set
  let locations = places
    .filter(place => place.location !== '')
    .reduce(
      (all, place) => {
        const { location, area } = place;
        const existing = all[location];
        const toMerge = {
          ...existing,
          name: location
        };

        if (!existing) {
          toMerge.id = v4();
        }

        if (area) {
          toMerge.areas = existing && existing.areas ? existing.areas.concat(area) : [area];
        }

        return {
          ...all,
          [location]: toMerge
        };
      },
      {});

  places = places.map(place => {
    if (!place.location) {
      return place;
    }
    const main = place.location;
    return {
      ...place,
      location: locations[main].id
    };
  });

  locations = Object
    .values(locations)
    .map(location => ({
      ...location,
      areas: uniq(location.areas)
    }));

  // Locations should be all places that have "addresses", parks and hotels I guess
  writeJsonSync('./src/data/locations.json', locations);
  // TODO: This probably goes away
  writeJsonSync('./src/data/places.json', places);
  // Attractions are things you can do at the parks, rides, events, games, character meets
  writeJsonSync('./src/data/attractions.json', attractionsWithIds);

  writeJsonSync('./src/data/dining.json', diningWithIds);

  process.exit();
})
.catch(e => console.log(e)); // tslint:disable-line no-console
