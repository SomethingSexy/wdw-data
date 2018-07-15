import { writeJSON } from 'fs-extra';
import { resolve } from 'path';
import * as data from './data/dining.json';

const dining = (data.default as any);

const save = async json => {
  return writeJSON(resolve(__dirname, './data/dining.json'), json);
};

/**
 * Model for retrieving persisted information about dining.
 */
export default {
  async findBy(name, value) {
    return dining.find(place => place[name] === value);
  },
  async findAllBy(name, values: string[] = []) {
    // just looping once to find, instead of starting over
    return dining.filter((place: any) => {
      return values.includes(place[name]);
    });
  },
  async get(id) {
    return dining.find(place => place.id === id);
  },
  async getAll() {
    return dining;
  },
  async update(item) {
    if (!item) {
      return null;
    }

    if (!item.id) {
      throw new Error('Id is required when updating dining.');
    }

    // this is probably slow right now.
    const updated = dining.map(diner => {
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
    const updated = dining.map(diner => {
      if (!flattened[diner[key]]) {
        return diner;
      }

      return {
        ...diner,
        ...flattened[diner[key]],
        id: diner.id
      };
    });

    await save(updated);

    return items;
  }
};
