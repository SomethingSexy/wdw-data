import { writeJSON } from 'fs-extra';
import { resolve } from 'path';
import * as data from './data/attractions.json';

const attractions = (data.default as any);

const save = async json => {
  return writeJSON(resolve(__dirname, './data/attractions.json'), json);
};

/**
 * Model for retrieving and updating data about attractions
 */
export default {
  async findBy(name, value) {
    return attractions.find(place => place[name] === value);
  },
  async findAllBy(name, values: string[] = []) {
    // just looping once to find, instead of starting over
    return attractions.filter((place: any) => {
      return values.includes(place[name]);
    });
  },
  async get(id) {
    return attractions.find(place => place.id === id);
  },
  async getAll() {
    return attractions;
  },
  async update(item) {
    if (!item) {
      return null;
    }

    if (!item.id) {
      throw new Error('Id is required when updating an attraction.');
    }

    // this is probably slow right now.
    const updated = attractions.map(diner => {
      if (diner.id !== item.id) {
        return diner;
      }

      return {
        ...diner,
        ...item
      };
    });

    await save(updated);

    return item;
  },
  async updateAll(items = [], ext = false) {
    const key = ext ? 'extId' : 'id';
    const flattened = items
      .reduce((all, item: any) => {
        return {
          ...all,
          [item[key]]: item
        };
      }, {}); // tslint:disable-line

    // also fucking slow -__-
    const updated = attractions.map(attraction => {
      if (!flattened[attraction[key]]) {
        return attraction;
      }

      return {
        ...attraction,
        ...flattened[attraction[key]],
        id: attraction.id
      };
    });

    await save(updated);

    return items;
  }
};
