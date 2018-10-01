import invariant from 'invariant';
import { ILocation, ILogger, ISchedule, IShopsModels } from '../../types';
import { asyncTransaction, Error, Success, } from '../utils';

/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateLocation = (item: ILocation) => {
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
export const validateLocations = (items: ILocation[]) => {
  if (!items || !items.length) {
    return 'Locations are required to add or update.';
  }
  const errors = items
    .map(validateLocation)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

class Locations {
  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: IShopsModels;

  constructor(sequelize, access, logger, models: IShopsModels) {
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
  public async bulkAddUpdate(items: ILocation[] = []): Promise<{[Error]?: any; [Success]?: any; }> {
    // if there are no items, just return an empty array
    const valid = validateLocations(items);
    if (valid !== true) {
      // if it not valid, return the known errors
      return { [Error]: valid };
    }
    this.logger('debug', `Adding and updating ${items.length} locations.`);
    const locations = await asyncTransaction(this.sequelize, items, async (item, transaction) => {
      const id = item.type === HOTEL_TYPE
        ? await addUpdateHotel(item, access, transaction, logger)
        : await addUpdateLocation(item, access, transaction, logger);

      return api.get(id);
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
    const { Shop } = this.models;
    return new Shop(this.sequelize, this.dao, this.logger, this.models, id);
  }

  /**
   * Searches for an area instance.
   * @param locationId
   * @param name
   * @param transaction
   */
  public async findAreaByName(locationId, name, transaction) {
    const { Area } = this.dao;
    return Area.findOne(
      { where: { locationId, name } }, { transaction }
    );
  }

  /**
   * Searches for a location instance by name
   * @param name
   * @param transaction
   */
  public async findByName(name, transaction) {
    const { Location } = this.dao;
    return Location.findOne(
      { where: { name } }, { transaction }
    );
  }

  /**
   * List all locations
   * @param where - search parameters
   */
  public async list(where?: { [key: string]: string | boolean }) {
    const { Address, Area, Location } = this.dao;
    let query: { attributes: string[], include: any[], where?: any } = {
      attributes: RAW_LOCATION_ATTRIBUTES, // tslint:disable-line
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

    return found.map(item => item.get({ plain: true }));
  }
}

export default Locations;
