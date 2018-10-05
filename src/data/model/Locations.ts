import invariant from 'invariant';
import { ILocation, ILocationsModels, ILogger } from '../../types';
import { Error, Success, syncTransaction } from '../utils';
import { RAW_LOCATION_ATTRIBUTES } from './Park';

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
  public async bulkAddUpdate(items: ILocation[] = []): Promise<{[Error]?: any; [Success]?: any; }> {
    // if there are no items, just return an empty array
    const valid = validateLocations(items);
    if (valid !== true) {
      // if it not valid, return the known errors
      return { [Error]: valid };
    }

    this.logger('debug', `Adding and updating ${items.length} locations.`);

    const locations = await syncTransaction(this.sequelize, items, async (item, transaction) => {
      // TODO; Figure out what we are doing with this
    //   const id = item.type === HOTEL_TYPE
    //     ? await addUpdateHotel(item, access, transaction, logger)
    //     : await addUpdateLocation(item, access, transaction, logger);
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
    const { Location } = this.models;
    return new Location(this.sequelize, this.dao, this.logger, this.models, id);
  }

  /**
   * Searches for a location instance by name
   * @param name
   * @param transaction
   */
  public async findByName(name, transaction) {
    const { Park, Hotel } = this.models;
    // find the instance of the model
    const instance = this.dao.Location.findOne(
      {
        attributes: ['id', 'type'],
        where: { name }
      },
      { transaction }
    );

    if (instance) {
      return null;
    }

    let type;
    // tslint:disable-next-line:prefer-conditional-expression
    if (instance.get('type') === 'resort') {
      type = new Hotel(this.sequelize, this.dao, this.logger, this.models, instance.get('id'));
    } else {
      type = new Park(this.sequelize, this.dao, this.logger, this.models, instance.get('id'));
    }

    // So this kind of sucks but allows us to break out what we need to do to load this data
    // based on the type of instance we are loading.
    await type.load();

    return type;
  }

  /**
   * Returns a list of raw locations.
   *
   * @param where - search parameters
   */
  public async list(where?: { [key: string]: string | boolean }) {
    const { Location } = this.models;
    const { Address, Area } = this.dao;
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

    const found = await this.dao.Location.findAll(query);

    // create new locations objects then parse the data
    return found.map(item => {
      const location = new Location(this.sequelize, this.dao, this.logger, this.models, item);
      return location.data;
    });
  }
}

export default Locations;
