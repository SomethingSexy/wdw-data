import invariant from 'invariant';
import {
  ILogger,
  IRestaurant,
  IRestaurantItem,
  IRestaurants,
  IRestaurantsModels
} from '../../types';
import { Error, Success, syncTransaction } from '../utils';
import { RAW_ACTIVITY_ATTRIBUTES } from './Activity';

/**
 * Validates a single dining.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateRestaurant = (item: IRestaurantItem) => {
  if (!item.type) {
    return 'Type is required for restaurant.';
  }

  if (!item.extId) {
    return 'ExtId is required for restaurant.';
  }

  return true;
};

/**
 * Validates all dining.
 * @param items
 */
export const validateRestaurants = (items: IRestaurantItem[]) => {
  if (!items || !items.length) {
    return 'Restaurants are required to add or update.';
  }
  const errors = items
    .map(validateRestaurant)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

class Restaurants implements IRestaurants {
  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: IRestaurantsModels;

  constructor(sequelize, access, logger, models: IRestaurantsModels) {
    this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.models = models;
  }

  /**
   * Bulk upsert restaurants.
   * @param items
   */
  public async bulkAddUpdate(items: IRestaurantItem[] = []) {
    // if there are no items, just return an empty array
    const valid = validateRestaurants(items);
    if (valid !== true) {
      // if it not valid, return the known errors
      return { [Error]: valid };
    }

    this.logger('debug', `Adding and updating ${items.length} restaurants.`);

    const restaurants = await syncTransaction(this.sequelize, items, async (item, transaction) => {
      const restaurant = this.createRestaurant(item.id || item.extId);
      const id = await restaurant.upsert(item, transaction);
      return id;
    });

    this.logger('debug', `Finished adding and updating ${restaurants.length} of ${items.length}.`);

    return { [Success]: restaurants };
  }

  /**
   * Factory for creating a restaurant model.
   * @param item
   */
  public createRestaurant(id: string): IRestaurant {
    invariant(id, 'Id is required to create an restaurant.');
    const { Restaurant } = this.models;
    return new Restaurant(this.sequelize, this.dao, this.logger, this.models, id);
  }

  /**
   * Retrieves an restaurant.
   * @param id
   * @returns - Returns an Restaurant model with the data loaded or null if not found
   */
  public async findById(id: string): Promise<IRestaurant | null> {
    const restaurant = this.createRestaurant(id);
    const loaded = await restaurant.load();

    if (!loaded) {
      return null;
    }

    return restaurant;
  }

  /**
   * List all restaurants
   * @param where - search parameters
   */
  public async findAll(where?: { [key: string]: string | boolean }): Promise<IRestaurant[]> {
    const { Age, Dining, Tag, ThrillFactor } = this.dao;
    let query: { attributes: string[], include: any[], where?: any } = {
      attributes: RAW_ACTIVITY_ATTRIBUTES,
      include: [{
        as: 'ActivityAges',
        attributes: ['name'],
        model: Age
      }, {
        as: 'ActivityTags',
        attributes: ['name'],
        model: Tag
      }, {
        as: 'ThrillFactors',
        attributes: ['name'],
        model: ThrillFactor
      }]
    };

    if (where) {
      invariant(
        Object.keys(where).length, 'Conditions are required when searching for restaurants.'
      );

      query = {
        ...query,
        where
      };
    }

    const found = await Dining.findAll(query);

    // create new shop objects then parse the data
    return found.map(item => this.createRestaurant(item));
  }

  /**
   * Returns a list of raw restaurants.
   *
   * @param where - search parameters
   */
  public async list(where?: { [key: string]: string | boolean }): Promise<IRestaurantItem[]> {
    const found = await this.findAll(where);
    return found.map(item => item.data);
  }
}

export default Restaurants;
