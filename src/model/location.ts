import * as data from '../data/locations.json';

const locations = (data as any);

export default {
  get(id) {
    return locations.find(place => place.id === id);
  },
  getAll() {
    return locations;
  }
};
