import * as data from './data/places.json';

const places = (data as any);

export default {
  get(id) {
    return places.find(place => place.id === id);
  },
  getAll() {
    return places;
  }
};
