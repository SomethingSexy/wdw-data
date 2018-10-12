import invariant from 'invariant';
import { ILocation, ILocationItem, ILocations, ILocationsModels, ILogger } from '../../types';
import { Error, Success, syncTransaction } from '../utils';
import { RAW_LOCATION_ATTRIBUTES } from './Location';

/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateLocation = (item: ILocationItem) => {
  if (!item.type) {
    return 'Type is required for location';
  }

  if (!item.extId) {
    return 'ExtId is required for location.';
  }

  return true;
};

/**
 * Validates all locations.
 * @param items
 */
export const validateLocations = (items: ILocationItem[]) => {
  if (!items || !items.length) {
    return 'Locations are required to add or update.';
  }
  const errors = items
    .map(validateLocation)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

class Locations implements ILocations {
  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: ILocationsModels;

  constructor(sequelize, access, logger, models: ILocationsModels) {
    this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.models = models;
  }

  /**
   * Upserts locations.  Returns an errors object if known errors are found,
   * otherwise will throw an exception for everything else.
   * @param items
   */
  public async bulkAddUpdate(
    items: ILocationItem[] = []
  ): Promise<{[Error]?: any; [Success]?: any; }> {
    // if there are no items, just return an empty array
    const valid = validateLocations(items);
    if (valid !== true) {
      // if it not valid, return the known errors
      return { [Error]: valid };
    }

    this.logger('debug', `Adding and updating ${items.length} locations.`);

    const locations = await syncTransaction(this.sequelize, items, async (item, transaction) => {
      // create a model for this shop,
      const location = this.createLocation(item.id || item.extId);
      // update it with the latest coming in
      await location.upsert(item, transaction);
      // then retrieve the data
      return location.data;
    });

    this.logger('debug', `Finished adding and updating ${locations.length} of ${items.length}.`);
    return { [Success]: locations };
  }

  /**
   * Factory for creating a location model.
   * @param item
   */
  public createLocation(id: string) {
    invariant(id, 'Id is required to create a shop.');
    // TODO: figure out why I need any here
    const Location: any = this.models.Location;
    return new Location(this.sequelize, this.dao, this.logger, this.models, id);
  }

  /**
   * Searches for a location instance by name
   * @param name
   * @param transaction
   */
  public async findByName(name: string, transaction?: any): Promise<ILocation | null> {
    // find the instance of the model
    const instance = await this.dao.Location.findOne(
      {
        attributes: ['id', 'type'],
        where: { name }
      },
      { transaction }
    );

    if (!instance) {
      return null;
    }

    return this.createLocation(instance);
  }

  /**
   * Returns a list of location models.
   *
   * @param where - search parameters
   */
  public async findAll(where?: { [key: string]: string | boolean }): Promise<ILocation[]> {
    const { Address, Area, Location } = this.dao;
    let query: { attributes: string[], include: any[], where?: any } = {
      attributes: RAW_LOCATION_ATTRIBUTES,
      include: [{
        as: 'address',
        attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
        model: Address
      }, {
        as: 'areas',
        attributes: ['name'],
        model: Area
      }]
    };

    if (where) {
      invariant(
        Object.keys(where).length, 'Conditions are required when searching for locations.'
      );
      query = {
        ...query,
        where
      };
    }

    const found = await Location.findAll(query);

    // create new locations objects then parse the data
    return found.map(item => this.createLocation(item));
  }

  /**
   * Returns a list of raw locations.
   *
   * @param where - search parameters
   */
  public async list(where?: { [key: string]: string | boolean }): Promise<any[]> {
    const found = await this.findAll(where);
    return found.map(item => item.data);
  }
}

export default Locations;
