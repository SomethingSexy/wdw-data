import invariant from 'invariant';
import isUUID from 'is-uuid';
import pick from 'lodash/pick'; // tslint:disable-line
import { ILocation, ILocationItem, ILocationModels, ILogger, ISchedule } from '../../types';
import { upsert } from '../utils';

const RAW_ADDRESS_ATTRIBUTES = [
  'city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'
];
const RAW_AREA_ATTRIBUTES = ['name'];
const RAW_ACTIVITIES_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url'];
const RAW_ROOM_ATTRIBUTES = [
  'bedsDescription',
  'occupancy',
  'occupancyDescription',
  'view',
  'description',
  'extId',
  'name',
  'pricingUrl'
];
// Note: extId is on here right now for the jobs
export const RAW_LOCATION_ATTRIBUTES = [
  'id', 'name', 'description', 'type', 'url', 'extId', 'fetchSchedule'
];

// const HOTEL_TYPE = 'resort';

export enum GetTypes {
  Activities = 'activities'
}

export const normalizeLocation = (resort: any): ILocationItem => {
  const core: ILocationItem = {
    activities: resort.location.activities,
    address: resort.location.address || null,
    areas: resort.location.areas ? resort.location.areas.map(area => area.name) : [],
    busStops: resort.busStops,
    description: resort.location.description,
    extId: resort.location.extId,
    extRefName: resort.location.extRefName,
    fetchSchedule: resort.location.fetchSchedule,
    id: resort.location.id,
    name: resort.location.name,
    rooms: resort.rooms,
    tier: resort.tier,
    type: resort.location.type,
    url: resort.location.url
  };

  return core;
};

class ResortModel implements ILocation {
  public static buildQuery(
    dao, { where }: { where?: {}}
  ): { attributes: string[], include: any[], where?: any } {
    const { Address, Area, BusStop, Location, Room, RoomConfiguration } = dao;
    let query: { attributes: string[], include: any[], where?: any } = {
      attributes: ['tier'],
      include: [{
        attributes: RAW_LOCATION_ATTRIBUTES,
        include: [{
          attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
          model: Address
        }, {
          attributes: ['name'],
          model: Area
        }],
        model: Location,
      }, {
        as: 'busStops',
        attributes: ['name'],
        model: BusStop
      },  {
        attributes: RAW_ROOM_ATTRIBUTES,
        include: [{
          as: 'roomConfigurations',
          attributes: ['count', 'description'],
          model: RoomConfiguration
        }],
        model: Room
      }]
    };

    if (where) {
      invariant(
        Object.keys(where).length, 'Conditions are required when searching for locations.'
      );
      query = {
        ...query,
        where: {
          ...query.where,
          where
        }
      };
    }

    return query;
  }

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
    // this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    // this.models = models;

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

  public bulkAddSchedules(_: { [date: string]: ISchedule[]; }) {
    throw new Error('bulkAddSchedules is not implemented for resorts.');
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
  public async load(include?: GetTypes[]): Promise<boolean> {
    const { Activity, Address, Area, BusStop, Hotel, Location, Room, RoomConfiguration } = this.dao;
    // setting to any because I am not gonna repeat sequelize's api
    const queryInclude: any[] = [{
      attributes: RAW_ADDRESS_ATTRIBUTES,
      model: Address
    }, {
      attributes: RAW_AREA_ATTRIBUTES,
      model: Area
    }, {
      attributes: ['tier'],
      include: [{
        // as: 'BusStops',
        attributes: ['name'],
        model: BusStop
      }],
      model: Hotel
    }, {
      // as: 'Rooms',
      attributes: RAW_ROOM_ATTRIBUTES,
      include: [{
        // as: 'RoomConfigurations',
        attributes: ['count', 'description'],
        model: RoomConfiguration
      }],
      model: Room
    }];

    // check to see if we are including different associations
    if (include) {
      include.forEach(i => {
        if (i === GetTypes.Activities) {
          queryInclude.push({
            attributes: RAW_ACTIVITIES_ATTRIBUTES,
            include: [{
              attributes: ['name'],
              model: Area
            }],
            model: Activity
          });
        }
      });
    }

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

  public async upsert (item: ILocationItem, transaction?): Promise<string> {
    const { Address, BusStop, Hotel, Location, Room, RoomConfiguration } = this.dao;
    this.logger('debug', `Adding/updating location ${this.id}.`);

    const data = {
      ...item,
      fetchSchedule: false
    };
    const locationInstance = await upsert(
      Location, data, {  [this.idKey]: this.id  }, transaction, item.address ? [Address] : null
    );

    this.logger('debug', `Finished adding/updating location ${this.id}.`);

    const hotelInstance = await upsert(
      Hotel,
      { tier: item.tier, locationId: locationInstance.get('id') },
      { locationId: locationInstance.get('id') },
      transaction,
    );
    // need to handle adding rooms separately because we want to update
    // if we have them already based on the extId
    if (item.rooms) {
      for (const room of item.rooms) {
        const roomInstance = await upsert(
          Room,
          { ...pick(room, RAW_ROOM_ATTRIBUTES), hotelId: hotelInstance.get('id') },
          { extId: room.extId },
          transaction
        );

        if (room.configurations) {
          for (const configuration of room.configurations) {
            await upsert(
              RoomConfiguration,
              { ...configuration, roomId: roomInstance.get('id') },
              { description: configuration.description, roomId: roomInstance.get('id') },
              transaction
            );
          }
        }
      }
    }

    if (item.busStops) {
      // either sync or async with Promise.all
      for (const stop of item.busStops) {
        await BusStop
          .findOne({ where: { hotelId: hotelInstance.get('id'), name: stop } }, { transaction })
          .then(obj => {
            if (!obj) {
              return BusStop.create(
                { hotelId: hotelInstance.get('id'), name: stop }, { transaction }
              );
            }

            return Promise.resolve();
          });
      }
    }

    // set the instance after we created,
    // TODO: Should we call update on existing instance if we already have it?
    this.instance = locationInstance;

    return locationInstance.get('id');
  }
}

export default ResortModel;
