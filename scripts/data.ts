import { writeJsonSync } from 'fs-extra';
import { uniq } from 'lodash';
import { v4 } from 'uuid';
import * as attractions from '../src/realtime/attractions';
import * as dining from '../src/realtime/dining';
import * as entertainment from '../src/realtime/entertainment';
import * as hotels from '../src/realtime/hotels';
import * as parks from '../src/realtime/parks';
import { IAttraction, IDining, IPark, IPlace } from '../src/types';

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

const runParks = () => {
  return parks.list().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

const runEntertainment = () => {
  return entertainment.list().then((results: any) => {
    return results;
  })
  .catch(e => console.log(e)); // tslint:disable-line no-console
};

// const runHours = () => {
//   return hours.list().then((results: any) => {
//     writeJsonSync('./src/data/hours.json', results);
//   });
// };

const addId = (place: any) => {
  return {
    ...place,
    id: v4()
  };
};

Promise.all(
  [runDining(), runAttractions(), runHotels(), runParks(), runEntertainment()]
).then(([
  fetchedDining = [],
  fetchedAttractions = [],
  fetchedHotels = [],
  fetchedParks = [],
  fetchedEntertainment = []
]) => {
  // start with parks and then add
  const parksWithIds = fetchedParks.map(addId);
  const attractionsWithIds = fetchedAttractions.map(addId);
  const diningWithIds = fetchedDining.map(addId);
  const hotelsWithIds = fetchedHotels.map(addId);
  const entertainmentWithIds = fetchedEntertainment.map(addId);

  let places: IPlace[] = parksWithIds
    .concat(diningWithIds)
    .concat(attractionsWithIds)
    .concat(hotelsWithIds)
    .concat(entertainmentWithIds);

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
  writeJsonSync('./src/data/attractions.json', attractionsWithIds);
  writeJsonSync('./src/data/dining.json', diningWithIds);
  writeJsonSync('./src/data/parks.json', parksWithIds);
  writeJsonSync('./src/data/hotels.json', hotelsWithIds);
  writeJsonSync('./src/data/entertainment.json', entertainmentWithIds);

  process.exit();
})
.catch(e => console.log(e)); // tslint:disable-line no-console
