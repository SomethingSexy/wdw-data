import { writeJSON } from 'fs-extra';
import { resolve } from 'path';
import * as data from './data/parks.json';
import { ISchedule } from './types';

const parks = (data.default as any);

const save = async json => {
  return writeJSON(resolve(__dirname, './data/parks.json'), json);
};

/**
 * Model for retrieving and updating data about attractions
 */
export default {
  /**
   * Add an array of schedules by date.
   * @param id - id of park
   * @param schedule - schedule to add
   */
  async addSchedule(id: string, schedule: { [date: string]: ISchedule[] }) {
    // If there is a current date already, just replace.
    let park = await this.get(id);
    if (!park.hours) {
      park = {
        ...park,
        hours: {}
      };
    }

    park = {
      ...park,
      hours: {
        ...park.hours,
        ...schedule
      }
    };

    return this.update(park);
  },
  async findBy(name: string, value: string) {
    return parks.find(place => place[name] === value);
  },
  async findAllBy(name: string, values: string[] = []) {
    // just looping once to find, instead of starting over
    return parks.filter((place: any) => {
      return values.includes(place[name]);
    });
  },
  async get(id: string) {
    return parks.find(place => place.id === id);
  },
  async getAll() {
    return parks;
  },
  async update(item) {
    if (!item) {
      return null;
    }

    if (!item.id) {
      throw new Error('Id is required when updating a park.');
    }

    // this is probably slow right now.
    const updated = parks.map(park => {
      if (park.id !== item.id) {
        return park;
      }

      return {
        ...park,
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
    const updated = parks.map(park => {
      if (!flattened[park[key]]) {
        return park;
      }

      return {
        ...park,
        ...flattened[park[key]],
        id: park.id
      };
    });

    await save(updated);

    return items;
  }
};
