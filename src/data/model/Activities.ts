import invariant from 'invariant';
import {
  IActivities,
  IActivitiesModels,
  IActivity,
  IActivityItem,
  IActivityWaitTime,
  ILogger
} from '../../types';
import { Error, Success, syncTransaction } from '../utils';
import { RAW_ACTIVITY_ATTRIBUTES } from './Activity';

/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateActivity = (item: IActivityItem) => {
  if (!item.type) {
    return 'Type is required for an activity.';
  }

  if (!item.extId) {
    return 'ExtId is required for activity.';
  }

  return true;
};

/**
 * Validates all activities.
 * @param items
 */
const validateActivities = (items: IActivityItem[]) => {
  if (!items || !items.length) {
    return 'Activities are required to add or update.';
  }
  const errors = items
    .map(validateActivity)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

class Activities implements IActivities {
  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: IActivitiesModels;

  constructor(sequelize, access, logger, models: IActivitiesModels) {
    this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.models = models;
  }

  /**
   * Bulk upsert activities.
   * @param items
   */
  public async bulkAddUpdate(items: IActivityItem[] = []) {
    // if there are no items, just return an empty array
    const valid = validateActivities(items);
    if (valid !== true) {
      // if it not valid, return the known errors
      return { [Error]: valid };
    }

    this.logger('debug', `Adding and updating ${items.length} activities.`);

    const activities = await syncTransaction(this.sequelize, items, async (item, transaction) => {
      const activity = this.createActivity(item.id || item.extId);
      const id = await activity.upsert(item, transaction);
      return id;
    });

    this.logger('debug', `Finished adding and updating ${activities.length} of ${items.length}.`);

    return { [Success]: activities };
  }

  public async bulkAddWaitTimes(timestamp: string, items: IActivityWaitTime[] = []) {
    const { Activity } = this.dao;

    return syncTransaction(this.sequelize, items, async (item, transaction) => {
      const { extId, waitTime } = item;
      const activityInstance = await Activity.findOne(
        { where: { extId } }, { transaction }
      );

      if (!activityInstance) {
        return Promise.resolve(false); // TODO log
      }

      const activity = await this.createActivity(activityInstance);

      return activity.addWaitTimes(timestamp, waitTime, transaction);
    });
  }

  /**
   * Factory for creating a activity model.
   * @param item
   */
  public createActivity(id: string): IActivity {
    invariant(id, 'Id is required to create an activity.');
    const { Activity } = this.models;
    return new Activity(this.sequelize, this.dao, this.logger, this.models, id);
  }

  /**
   * Retrieves an activity.
   * @param id
   * @returns - Returns an Activity model with the data loaded or null if not found
   */
  public async findById(id: string): Promise<IActivity | null> {
    const activity = this.createActivity(id);
    const loaded = await activity.load();

    if (!loaded) {
      return null;
    }

    return activity;
  }

  /**
   * List all activities
   * @param where - search parameters
   */
  public async findAll(where?: { [key: string]: string | boolean }): Promise<IActivity[]> {
    const { Activity, Age, Tag, ThrillFactor }  = this.dao;
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
        Object.keys(where).length, 'Conditions are required when searching for activites.'
      );

      query = {
        ...query,
        where
      };
    }

    const found = await Activity.findAll(query);

    // create new shop objects then parse the data
    return found.map(item => this.createActivity(item));
  }

  /**
   * Returns a list of raw activities.
   *
   * @param where - search parameters
   */
  public async list(where?: { [key: string]: string | boolean }): Promise<IActivityItem[]> {
    const found = await this.findAll(where);
    return found.map(item => item.data);
  }
}

export default Activities;
