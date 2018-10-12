import invariant from 'invariant';
import isUUID from 'is-uuid';
import { omit } from 'lodash';
import { ILocations, ILogger, IRestaurant, IRestaurantItem, IRestaurantModels } from '../../types';
import { upsert } from '../utils';

// Note: returning extId for jobs
const RAW_DINING_ATTRIBUTES = [
  'admissionRequired',
  'costDescription',
  'description',
  'diningEvent',
  'extId',
  'id',
  'name',
  'quickService',
  'tableService',
  'type',
  'url',
  'locationId',
  'areaId'
];

const normalizeDining = (dining): IRestaurantItem => {
  const item: IRestaurantItem = omit(dining, ['DiningCuisines', 'DiningTags']);
  item.cuisine = dining.DiningCuisines.map(cuisine => cuisine.name);
  item.tags = dining.DiningTags.map(tag => tag.name);
  return item;
};

export const types = {
  ENTERTAINMENT: 'entertainment'
};

/**
 *
 */
class Restaurant implements IRestaurant {
  public instance: any = null;

  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: IRestaurantModels;
  private _id: string = '';
  private isExt: boolean = false;
  private idKey: string = 'id';

  private get locations(): ILocations {
    // TODO: Figure out why I need any here
    const Locations: any = this.models.Locations;
    return new Locations(this.sequelize, this.dao, this.logger, this.models);
  }

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
  constructor(sequelize: any, access: any, logger: ILogger, models: IRestaurantModels, id: any) {
    invariant(id, 'Internal or external id is required to create an Activity.');
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

  public get data(): IRestaurantItem {
    // if no instance, throw an error
    invariant(this.instance, 'An instance is required to retrieve data, call load first.');
    const raw = this.instance.get({ plain: true });

    return normalizeDining(raw);
  }

  public async upsert(item: IRestaurantItem, transaction?) {
    this.logger('debug', `Adding/updating dining ${item.extId}.`);
    const { Cuisine, Dining, Tag } = this.dao;
    const Locations = this.locations;
    const activityItem: any = {
      admissionRequired: item.admissionRequired,
      costDescription: item.costDescription,
      description: item.description,
      diningEvent: item.diningEvent,
      extId: item.extId,
      extRefName: item.extRefName,
      // only rule so far
      fetchSchedule: item.type === types.ENTERTAINMENT,
      name: item.name,
      quickService: item.quickService,
      tableService: item.tableService,
      type: item.type,
      url: item.url
    };

    if (item.id) {
      activityItem.id = item.id;
    }

    const instance = await upsert(
      Dining, activityItem, { extId: item.extId }, transaction
    );

    if (item.location) {
      const location = await Locations.findByName(item.location, transaction);
      if (location) {
        await instance.setLocation(location.instance, { transaction });
        if (item.area) {
          let areaInst =
            await location.findAreaByName(item.area, transaction);

          if (!areaInst) {
            areaInst = await location.addArea(item.area, transaction);
          }

          await instance.setArea(areaInst, { transaction });
        }
      }
    }

    if (item.tags) {
      // either sync or async with Promise.all
      for (const tagName of item.tags) {
        const tagInst = await upsert(
          Tag, { name: tagName, from: 'dining' }, { name: tagName }, transaction
        );
        if (!await instance.hasDiningTags(tagInst)) {
          await instance.addDiningTags(tagInst, { transaction });
        }
      }
    }

    if (item.cuisine) {
      // either sync or async with Promise.all
      for (const cuisine of item.cuisine) {
        const cuisineInst = await upsert(
          Cuisine, { name: cuisine }, { name: cuisine }, transaction
        );
        if (!await instance.hasDiningCuisines(cuisineInst)) {
          await instance.addDiningCuisines(cuisineInst, { transaction });
        }
      }
    }

    this.logger('debug', `Finished adding/updating dining ${item.extId}.`);
    return instance.get('id');
  }

  public async load(): Promise<boolean> {
    const { Dining, Tag, Cuisine } = this.dao;
    // setting to any because I am not gonna repeat sequelize's api
    const queryInclude: any[] = [{
      as: 'DiningTags',
      attributes: ['name'],
      model: Tag
    }, {
      as: 'DiningCuisines',
      attributes: ['name'],
      model: Cuisine
    }];

    const query = {
      attributes: RAW_DINING_ATTRIBUTES,
      include: queryInclude,
      where: { [this.idKey]: this.id  }
    };

    if (this.instance) {
      await this.instance.reload(query);
    } else {
      this.instance = await Dining.findOne(query);
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

export default Restaurant;
