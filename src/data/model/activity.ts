import invariant from 'invariant';
import pick from 'lodash/pick'; // tslint:disable-line
import { IActivity, ISchedule } from '../../types';
import { Error, Success, syncTransaction, upsert } from '../utils';
import date from './date';
import location from './location';

// Note: returning extId for jobs
const RAW_ACTIVITY_ATTRIBUTES = [
  'admissionRequired',
  'allowServiceAnimals',
  'description',
  'extId',
  'fastPass',
  'fastPassPlus',
  'height',
  'id',
  'name',
  'riderSwapAvailable',
  'type',
  'url',
  'wheelchairTransfer',
  'locationId',
  'areaId'
];

const normalizeActivity = activity => ({
  ...pick(activity, RAW_ACTIVITY_ATTRIBUTES),
  ages: activity.ActivityAges.map(age => age.name),
  tags: activity.ActivityTags.map(tag => tag.name),
  thrills: activity.ThrillFactors.map(factor => factor.name)
});

export const types = {
  ENTERTAINMENT: 'entertainment'
};

const addUpdateActivity = async (item: IActivity, Location, access, transaction, logger) => {
  logger('debug', `Adding/updating activity ${item.extId}.`);
  const { Activity, Age, Tag, ThrillFactor } = access;
  const activityItem: any = {
    admissionRequired: item.admissionRequired,
    allowServiceAnimals: item.allowServiceAnimals,
    description: item.description,
    extId: item.extId,
    extRefName: item.extRefName,
    fastPass: item.fastPass,
    fastPassPlus: item.fastPassPlus,
    // only rule so far
    fetchSchedule: item.type === types.ENTERTAINMENT,
    height: item.height,
    latitude: item.coordinates ? item.coordinates.gps.latitude : null,
    longitude: item.coordinates ? item.coordinates.gps.longitude : null,
    name: item.name,
    riderSwapAvailable: item.riderSwapAvailable,
    type: item.type,
    url: item.url,
    wheelchairTransfer: item.wheelchairTransfer
  };

  if (item.id) {
    activityItem.id = item.id;
  }

  const activityInst = await upsert(
    Activity, activityItem, { extId: item.extId }, transaction
  );

  if (item.location) {
    const locationInstance = await Location.findByName(item.location, transaction);
    if (locationInstance) {
      await activityInst.setLocation(locationInstance, { transaction });
    }
    // TODO: else log an issue if we cannot find a location
    // if there is a location, we might also have an area, however
    // we have to add the area here because there is no other way
    // to easily generate them
    if (item.area) {
      const locationId = locationInstance.get('id');
      let areaInst =
        await Location.findAreaByName(locationId, item.area, transaction);

      if (!areaInst) {
        areaInst = await Location.addArea(locationId, item.area, transaction);
      }

      await activityInst.setArea(areaInst, { transaction });
    }
  }

  // check thrill factors
  if (item.thrillFactor) {
    // either sync or async with Promise.all
    for (const factor of item.thrillFactor) {
      const thrillInst = await upsert(
        ThrillFactor, { name: factor }, { name: factor }, transaction
      );
      if (!await activityInst.hasThrillFactors(thrillInst)) {
        await activityInst.addThrillFactors(thrillInst, { transaction });
      }
    }
  }

  if (item.ages) {
    // either sync or async with Promise.all
    for (const ageName of item.ages) {
      const ageInst = await upsert(
        Age, { name: ageName }, { name: ageName }, transaction
      );
      if (!await activityInst.hasActivityAges(ageInst)) {
        await activityInst.addActivityAges(ageInst, { transaction });
      }
    }
  }

  if (item.tags) {
    // either sync or async with Promise.all
    for (const tagName of item.tags) {
      const tagInst = await upsert(
        Tag, { name: tagName, from: 'activity' }, { name: tagName }, transaction
      );
      if (!await activityInst.hasActivityTags(tagInst)) {
        await activityInst.addActivityTags(tagInst, { transaction });
      }
    }
  }
  logger('debug', `Finished adding/updating activity ${item.extId}.`);
  return activityInst.get('id');
};

/**
 * Validates a single location.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateActivity = (item: IActivity) => {
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
export const validateActivities = (items: IActivity[]) => {
  if (!items || !items.length) {
    return 'Activities are required to add or update.';
  }
  const errors = items
    .map(validateActivity)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

export default (sequelize, access, logger) => {
  const api = {
    async addSchedule(
      activityId: string, scheduleDate: string, parkSchedules, transaction
    ) {
      const { ActivitySchedule, Schedule } = access;

      const DateModel = date(sequelize, access);
      const dateInstance = await DateModel.get(scheduleDate, transaction);
      const dateId = dateInstance.get('id');

      // Check to see if we have any schedules for this location and date already
      // this might cause issues in the future if we did not update everything,
      // worry about that if it comes up
      const alreadyAdded = await ActivitySchedule
        .findOne({ where: { activityId, dateId } });

      if (alreadyAdded) {
        return null;
      }

      return Promise.all(
        parkSchedules.map(data => Schedule.create(data, { transaction }))
      )
      .then(scheduleInstances => {
        return Promise.all(
          scheduleInstances.map(scheduleInstance =>
            dateInstance.addActivitySchedule(
              scheduleInstance,
              {
                transaction,
                through: { activityId } // tslint:disable-line
              }
            )
          )
        );
      });
    },
    async addSchedules(id: string, schedules: {[date: string]: ISchedule[]}) {
      // check if date exists already.
      await Promise.all(
        Object
          .entries(schedules)
          .map(([key, value]) => {
            return sequelize.transaction(t => {
              return api.addSchedule(id, key, value, t);
            });
          })
        );
      // TODO: Figure out what to return from here, probably call get location schedule
      return { [Success]: true };
    },
    async addUpdate(items: IActivity[] = []) {
      // if there are no items, just return an empty array
      const valid = validateActivities(items);
      if (valid !== true) {
        // if it not valid, return the known errors
        return { [Error]: valid };
      }
      logger('debug', `Adding and updating ${items.length} activities.`);

      const Location = location(sequelize, access, logger);

      const activities = await syncTransaction(sequelize, items, async (item, transction) => {
        const id = await addUpdateActivity(item, Location, access, transction, logger);
        return api.get(id);
      });

      logger('debug', `Finished adding and updating ${activities.length} of ${items.length}.`);
      return { [Success]: activities };
    },
    async addWaitTimes(timestamp: string, items = []) {
      const { Activity, WaitTime } = access;
      const DateModel = date(sequelize, access);
      // grab the date instanced first, reuse for everything else.
      const dateInstance = await sequelize.transaction(async t => DateModel.get(timestamp, t));

      return syncTransaction(sequelize, items, async (item, transaction) => {
        const { extId, waitTime } = item;  // tslint:disable-line
        const activityInstance = await Activity.findOne(
          { where: { extId } }, { transaction }
        );

        if (!activityInstance) {
          return Promise.resolve(false); // TODO log
        }

        // TODO: Do we want to store another id for the timestamp or
        // just do find by activityId, dateId and groupby timestamp?
        return WaitTime.create(
          {
            timestamp,
            activityId: activityInstance.get('id'), // tslint:disable-line
            dateId: dateInstance.get('id'),
            fastPassAvailable: waitTime.fastPass.available,
            singleRider: waitTime.singleRider,
            status: waitTime.status,
            statusMessage: waitTime.rollUpStatus,
            wait: waitTime.postedWaitMinutes,
            waitMessage: waitTime.rollUpWaitTimeMessage
          }
        );
      });
    },
    /**
     * Returns a raw activity by id.
     * @param id
     */
    async get(id: string) {
      const { Activity, Age, Tag, ThrillFactor } = access;
      // setting to any because I am not gonna repeat sequelize's api
      const queryInclude: any[] = [{
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
      }];

      const activity = await sequelize.transaction(async transaction => {
        const found = await Activity.findOne(
          {
            attributes: RAW_ACTIVITY_ATTRIBUTES,
            include: queryInclude,
            where: { id }
          },
          { transaction }
        );

        if (!found) {
          // let the caller handle not found
          return null;
        }

        const raw = found.get({ plain: true });
        return normalizeActivity(raw);
      });

      return activity;
    },
    async getActivitySchedule(id: string, byDate: string) {
      // First lets verify that this location exists
      const { Date, Activity, ActivitySchedule, Schedule } = access;
      const found = await Activity.findOne({ where: { id } });
      // if we are trying to find schedules for a location that doesn't exist
      // throw an exception here.
      if (!found) {
        logger('error', `Activity ${id} not found when searching for schedules.`);
        return null;
      }

      if (!found.get('fetchSchedule')) {
        logger('error', `Activity ${id} does not support schedules.`);
        return null;
      }

      // Grab the date instance, if there is no date, that means we do not
      // have any schedules for this location.
      const dateInst = await Date.findOne({ where: { date: byDate } });
      if (!dateInst) {
        logger('debug', `No date for ${byDate} when searching for schedules for activity ${id}`);
        return [];
      }
      // I am sure there is a better way to do this
      const schedules = await ActivitySchedule.findAll({
        include: [{
          model: Schedule
        }, {
          model: Date
        }],
        where: { dateId: dateInst.get('id'), activityId: found.get('id') },
      });
      return schedules.map(item => {
        const raw = item.get({ plain: true });
        return {
          ...pick(raw.schedule, ['closing', 'opening', 'isSpecialHours', 'type']),
          ...pick(raw.date, ['date', 'holiday', 'isHoliday'])
        };
      });
    },
    /**
     * Returns waittimes for an activity, if they are available
     * @param id
     * @param dates
     */
    async getWaittimes (id: string, dates: string[]) {
      invariant(id, 'Activity id is required to get wait times.');
      invariant(dates.length, 'Dates are required to get wait times.');
      const { Date, WaitTime } = access;
      const waitTimes = await Promise.all(
        dates.map(async byDate => {
          logger('debug', `Fetching wait times for ${id} ${byDate}.`);
          const dateInst = await Date.findOne({ where: { date: byDate } });
          if (!dateInst) {
            logger(
              'debug',
              `No date for ${byDate} when searching for schedules for activity ${id}`
            );
            return null;
          }

          const times = await WaitTime.findAll(
            { where: { dateId: dateInst.get('id'), activityId: id } }
          );
          logger('debug', `Found ${times.length} wait times for ${id} ${byDate}.`);

          // need to make sure we convert over to the plain objects
          return {
            date: byDate,
            waitTimes: times.map(item => item.get({ plain: true }))
          };
        })
      );

      return waitTimes
        .reduce(
          (all, d) => {
            if (!d) {
              return all;
            }
            return {
              ...all,
              [d.date]: d.waitTimes
            };
          },
          {}
        );
    },
    /**
     * List all activities
     * @param where - search parameters
     */
    async list(where?: { [key: string]: string | boolean }) {
      const { Activity, Age, Tag, ThrillFactor } = access;
      let query: { attributes: string[], include: any[], where?: any } = {
        attributes: RAW_ACTIVITY_ATTRIBUTES, // tslint:disable-line
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
          Object.keys(where).length, 'Conditions are required when searching for activities.'
        );

        query = {
          ...query,
          where
        };
      }

      const found = Activity.findAll(query);

      return found.map(item => {
        // need to further normalize
        const raw = item.get({ plain: true });
        return normalizeActivity(raw);
      });
    }
  };

  return api;
};
