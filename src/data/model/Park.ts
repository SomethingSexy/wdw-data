import invariant from 'invariant';
import isUUID from 'is-uuid';
import pick from 'lodash/pick'; // tslint:disable-line
import { ILocation, ILocationItem, ILocationModels, ILogger, ISchedule } from '../../types';
import { Success, upsert } from '../utils';

const RAW_ADDRESS_ATTRIBUTES = [
  'city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'
];
const RAW_AREA_ATTRIBUTES = ['name'];
const RAW_ACTIVITIES_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url'];

// Note: extId is on here right now for the jobs
export const RAW_LOCATION_ATTRIBUTES = [
  'id', 'name', 'description', 'type', 'url', 'extId', 'fetchSchedule'
];

export enum GetTypes {
  Activities = 'activities'
}

export const normalizeLocation = (location: any): ILocationItem => {
  const core: ILocationItem = {
    activities: location.activities,
    address: location.Address || null,
    areas: location.areas ? location.areas.map(area => area.name) : [],
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

class ParkModel implements ILocation {
  public instance: any = null;

  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: ILocationModels;
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
  constructor(sequelize: any, access: any, logger: ILogger, models: ILocationModels, id: any) {
    invariant(id, 'Internal or external id is required to create a Location.');
    this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.models = models;

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

  public async addSchedule(scheduleDate: string, parkSchedules, transaction) {
    const { LocationSchedule, Schedule } = this.dao;
    let found = true;
    if (!this.instance) {
      found = await this.load();
    }

    if (!found) {
      this.logger('error', `Location ${this.id} not found when adding a schedule.`);
      return null;
    }

    const { Date } = this.models;
    const dateModel = new Date(this.sequelize, this.dao, this.logger, scheduleDate);
    await dateModel.load(transaction);
    const dateId = dateModel.data.id;

    // Check to see if we have any schedules for this location and date already
    // this might cause issues in the future if we did not update everything,
    // worry about that if it comes up
    const alreadyAdded = await LocationSchedule
      .findOne({ where: { dateId, locationId: this.id } });

    if (alreadyAdded) {
      return null;
    }

    // TODO: This is going to return the instance, we probably don't want that in
    // the long run
    await Promise.all(
      parkSchedules.map(data => Schedule.create(data, { transaction }))
    )
    .then(scheduleInstances => {
      return Promise.all(
        scheduleInstances.map(scheduleInstance =>
          // TODO: is this better than putting this function on the model?
          dateModel.instance.addSchedule(
            scheduleInstance,
            {
              transaction,
              through: { locationId: this.id } // tslint:disable-line
            }
          )
        )
      );
    });

    return { [Success]: true };
  }
  public async bulkAddSchedules(parkSchedules: {[date: string]: ISchedule[]}) {
    let found = true;

    if (!this.instance) {
      found = await this.load();
    }
    // if we are trying to find schedules for a location that doesn't exist
    // throw an exception here.
    if (!found) {
      this.logger('error', `Location ${this.id} not found when adding schedules.`);
      return null;
    }

    if (!this.instance.get('fetchSchedule')) {
      this.logger('error', `Location ${this.id} does not support schedules.`);
      return null;
    }

    await Promise.all(
      Object
        .entries(parkSchedules)
        .map(([key, value]) => {
          return this.sequelize.transaction(t => {
            return this.addSchedule(key, value, t);
          });
        })
        .filter(schedule => schedule !== null)
      );

    // TODO: Figure out what to return from here, probably call get location schedule
    return { [Success]: true };
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
    const { Activity, Address, Area, Location } = this.dao;
    const queryInclude: any[] = [{
      attributes: RAW_ADDRESS_ATTRIBUTES,
      model: Address
    }, {
      attributes: RAW_AREA_ATTRIBUTES,
      model: Area
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

  /**
   * Retrieves schedules for a given day.
   * @param id
   * @param date
   * @returns - Array of schedules for the given day.  Returns null if the location cannot b
   *            found or an empty array if no schedules are found.
   */
  public async getSchedule(byDate: string) {
    // First lets verify that this location exists
    const { Date, LocationSchedule, Schedule } = this.dao;
    let found = true;
    if (!this.instance) {
      found = await this.load();
    }
    // if we are trying to find schedules for a location that doesn't exist
    // throw an exception here.
    if (!found) {
      this.logger('error', `Location ${this.id} not found when searching for schedules.`);
      return null;
    }

    // Grab the date instance, if there is no date, that means we do not
    // have any schedules for this location.
    const dateInst = await Date.findOne({ where: { date: byDate } });
    if (!dateInst) {
      this.logger(
        'debug',
        `No date for ${byDate} when searching for schedules for location ${this.id}`
      );
      return [];
    }
    // I am sure there is a better way to do this
    const schedules = await LocationSchedule.findAll({
      include: [{
        model: Schedule
      }, {
        model: Date
      }],
      where: { dateId: dateInst.get('id'), locationId: this.instance.get('id') },
    });
    return schedules.map(item => {
      const raw = item.get({ plain: true });
      return {
        ...pick(raw.schedule, ['closing', 'opening', 'isSpecialHours', 'type']),
        ...pick(raw.date, ['date', 'holiday', 'isHoliday'])
      };
    });
  }

  public async upsert (item: ILocationItem, transaction?): Promise<string> {
    const { Address, Location } = this.dao;
    this.logger('debug', `Adding/updating location ${this.id}.`);

    const data = {
      ...item,
      fetchSchedule: true
    };
    const locationInstance = await upsert(
      Location, data, {  [this.idKey]: this.id  }, transaction, item.address ? [Address] : null
    );

    this.logger('debug', `Finished adding/updating location ${this.id}.`);

    // set the instance after we created,
    // TODO: Should we call update on existing instance if we already have it?
    this.instance = locationInstance;

    return locationInstance.get('id');
  }
}

export default ParkModel;
