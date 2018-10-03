import invariant from 'invariant';
import isUUID from 'is-uuid';
import pick from 'lodash/pick'; // tslint:disable-line
import { ILocation, ILocationModels, ILogger, ISchedule } from '../../types';
import { Success, upsert } from '../utils';

// Note: extId is on here right now for the jobs
const RAW_LOCATION_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url', 'extId'];
const RAW_ADDRESS_ATTRIBUTES = [
  'city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'
];
const RAW_AREA_ATTRIBUTES = ['name'];
const RAW_ACTIVITIES_ATTRIBUTES = ['id', 'name', 'description', 'type', 'url'];

export enum GetTypes {
  Activities = 'activities'
}

export const normalizeLocation = location => ({
  ...pick(location, RAW_LOCATION_ATTRIBUTES),
  address: location.Address || null,
  areas: location.Areas.map(area => area.name)
});

class LocationModel {
  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: ILocationModels;
  private _id: string = '';
  private isExt: boolean = false;
  private idKey: string = 'id';
  private instance: any = null;

  public set id(id: string) {
    this._id = id;
    this.isExt = !isUUID.v4(id);
    this.idKey = this.isExt ? 'extId' : 'id';
  }

  public get id(): string {
    return this._id;
  }

  constructor(sequelize, access, logger,  models: ILocationModels, id) {
    this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.id = id;
    this.isExt = !isUUID.v4(id);
    this.idKey = this.isExt ? 'extId' : 'id';
    this.models = models;
    this.instance = null;
  }

  public get data() {
    // if no instance, throw an error
    invariant(this.instance, 'An instance is required to retrieve data, call load first.');
    const raw = this.instance.get({ plain: true });

    return normalizeLocation(raw);

    // if this is a resort, then we need to grab the resort information
    // if (raw.get('type') === 'resort') {
    //   const hotel = await Hotel
    //     .findOne({ where: { locationId: found.get('id') } }, { transaction });
    //   // just save off tier for now
    //   raw = {
    //     ...raw,
    //     tier: hotel.get('tier')
    //   };
    // }

    // return raw;
  }

  public async addArea(locationId, name, transaction) {
    const { Area } = this.dao;
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
    // if we are trying to find schedules for a location that doesn't exist
    // throw an exception here.
    if (!found) {
      this.logger('error', `Location ${this.id} not found when adding a schedule.`);
      return null;
    }

    const { Date } = this.models;
    const dateModel = new Date(this.sequelize, this.dao, this.logger);
    const dateInstance = await dateModel.load(scheduleDate);

    // Check to see if we have any schedules for this location and date already
    // this might cause issues in the future if we did not update everything,
    // worry about that if it comes up
    const alreadyAdded = await LocationSchedule
      .findOne({ where: { dateId: dateInstance.get('id'), locationId: this.id } });

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
          dateInstance.addSchedule(
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
   * Returns a raw location by id.
   * @param id
   */
  public async load(include?: GetTypes[]) {
    const { Activity, Address, Area, Location } = this.dao;
    // setting to any because I am not gonna repeat sequelize's api
    const queryInclude: any[] = [{
      as: 'Address',
      attributes: RAW_ADDRESS_ATTRIBUTES,
      model: Address
    }, {
      as: 'Areas',
      attributes: RAW_AREA_ATTRIBUTES,
      model: Area
    }];

    // check to see if we are including different associations
    if (include) {
      include.forEach(i => {
        if (i === GetTypes.Activities) {
          queryInclude.push({
            as: 'Activities',
            attributes: RAW_ACTIVITIES_ATTRIBUTES,
            include: [{
              as: 'Area',
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
  public async getLocationSchedule(byDate: string) {
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

  public async upsert (item: ILocation, transaction?) {
    const { Location } = this.dao;
    this.logger('debug', `Adding/updating location ${this.id}.`);

    const data = {
      ...item,
      fetchSchedule: item.type !== 'entertainment-venue'
    };
    const locationInstance = await upsert(Location, data, {  [this.idKey]: this.id  }, transaction);

    this.logger('debug', `Finished adding/updating location ${this.id}.`);

    // set the instance after we created,
    // TODO: Should we call update on existing instance if we already have it?
    this.instance = locationInstance;

    return locationInstance.get('id');
  }
}

export default LocationModel;
