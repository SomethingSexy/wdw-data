import invariant from 'invariant';
import { ILocation, ILocationItem, ILocations, ILocationsModels, ILogger } from '../../types';

const PARK_TYPE = 'theme-park';
const ENTERTAINMENT_TYPE = 'entertainment-venue';

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
   * Factory for creating a location model.
   * @param item
   */
  public create(id: string) {
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
        where: { name, type: [PARK_TYPE, ENTERTAINMENT_TYPE] }
      },
      { transaction }
    );

    if (!instance) {
      return null;
    }

    return this.create(instance);
  }
}

export default Locations;
