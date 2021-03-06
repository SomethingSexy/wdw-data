import invariant from 'invariant';
import isUUID from 'is-uuid';
import { ILocation, ILocationItem, ILocationModels, ILogger } from '../../types';

// Note: extId is on here right now for the jobs
export const RAW_LOCATION_ATTRIBUTES = [
  'id', 'name', 'description', 'type', 'url', 'extId', 'fetchSchedule'
];

export enum GetTypes {
  Activities = 'activities'
}

export const normalizeLocation = (location: any): ILocationItem => {
  const core: ILocationItem = {
    description: location.description,
    extId: location.extId,
    extRefName: location.extRefName,
    fetchSchedule: location.fetchSchedule,
    id: location.id,
    name: location.name,
    type: location.type,
    url: location.url
  };

  return core;
};

class LocationModel implements ILocation {
  public instance: any = null;

  private dao: any;
  private logger: ILogger;
  private _id: string = '';
  private isExt: boolean = false;
  private idKey: string = 'id';

  public set id(id: string) {
    this._id = id;
    this.isExt = !isUUID.v4(id);
    this.idKey = this.isExt ? 'extId' : 'id';
  }

  public get id(): string {
    return this._id;
  }

  /**
   *
   * @param sequelize
   * @param access
   * @param logger
   * @param models
   * @param id - string or location instance to preload
   */
  constructor({}: any, access: any, logger: ILogger, {}: ILocationModels, id: any) {
    invariant(id, 'Internal or external id is required to create a Location.');
    this.dao = access;
    this.logger = logger;

    if (typeof id === 'string') {
      this.id = id;
      this.isExt = !isUUID.v4(id);
      this.idKey = this.isExt ? 'extId' : 'id';
      this.instance = null;
    } else {
      // we are assuming instance for now
      this.instance = id;
      this.id = this.instance.get('id');
    }
  }

  public get data(): ILocationItem {
    // if no instance, throw an error
    invariant(this.instance, 'An instance is required to retrieve data, call load first.');
    const raw = this.instance.get({ plain: true });

    return normalizeLocation(raw);
  }

  /**
   * Adds area and returns the instance for now.
   * @param name
   * @param transaction
   */
  public async addArea(name: string, transaction?: any): Promise<any | null> {
    let found = true;
    if (!this.instance) {
      found = await this.load();
    }
    if (!found) {
      this.logger('error', `Location ${this.id} not found when trying to find an area.`);
      return null;
    }

    const { Area } = this.dao;
    const locationId = this.instance.get('id');
    // location and name should be unique combination
    const exist = await Area.findOne(
      { where: { locationId, name } }, { transaction }
    );

    if (exist) {
      return exist;
    }

    return Area.create({ locationId, name }, { transaction });
  }

  public bulkAddSchedules(_) {
    throw new Error('bulkAddSchedules is not implemented for locations.');
  }

  /**
   * Searches for an area instance.
   * @param name
   * @param transaction
   */
  public async findAreaByName(name: string, transaction?: any): Promise<any | null> {
    let found = true;
    if (!this.instance) {
      found = await this.load();
    }
    if (!found) {
      this.logger('error', `Location ${this.id} not found when trying to find an area.`);
      return null;
    }

    const { Area } = this.dao;
    const locationId = this.instance.get('id');

    // TODO; Return model
    return Area.findOne(
      { where: { locationId, name } }, { transaction }
    );
  }
  /**
   * Returns a raw location by id.
   * @param id
   */
  public async load(): Promise<boolean> {
    const { Location } = this.dao;
    const queryInclude: any[] = [];

    const query = {
      attributes: RAW_LOCATION_ATTRIBUTES,
      include: queryInclude,
      where: { [this.idKey]: this.id  }
    };

    if (this.instance) {
      await this.instance.reload(query);
    } else {
      this.instance = await Location.findOne(query);
    }

    if (!this.instance) {
      // let the caller handle not found
      this.instance = null;
      return false;
    }

    // lets reset the id to the internal one
    this.id = this.instance.get('id');
    return true;
  }
}

export default LocationModel;
