import invariant from 'invariant';
import pick from 'lodash/pick'; // tslint:disable-line
import { IDining } from '../../types';
import { syncTransaction, upsert } from '../utils';
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

const addUpdateDining = async (item: IDining, Location, access, transaction, logger) => {
  logger('debug', `Adding/updating dining ${item.extId}.`);
  const { Cuisine, Dining, Tag } = access;
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

  const diningInst = await upsert(
    Dining, activityItem, { extId: item.extId }, transaction
  );

  if (item.location) {
    const locationInstance = await Location.findByName(item.location, transaction);
    if (locationInstance) {
      await diningInst.setLocation(locationInstance, { transaction });
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

      await diningInst.setArea(areaInst, { transaction });
    }
  }

  if (item.tags) {
    // either sync or async with Promise.all
    for (const tagName of item.tags) {
      const tagInst = await upsert(
        Tag, { name: tagName, from: 'dining' }, { name: tagName }, transaction
      );
      if (!await diningInst.hasDiningTags(tagInst)) {
        await diningInst.addDiningTags(tagInst, { transaction });
      }
    }
  }

  if (item.cuisine) {
    for (const cuisine of item.cuisine) {
      await upsert(
        Cuisine, { name: cuisine, diningId: diningInst.get('id') }, { name: cuisine }, transaction
      );
    }
  }
  logger('debug', `Finished adding/updating dining ${item.extId}.`);
  return diningInst.get('id');
};

/**
 * Validates a single dining.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateDining = (item: IDining) => {
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
export const validateAllDining = (items: IDining[]) => {
  if (!items || !items.length) {
    return 'Activities are required to add or update.';
  }
  const errors = items
    .map(validateDining)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

export default (sequelize, access, logger) => {
  const api = {
    async addUpdate(items: IDining[] = []) {
      const Location = location(sequelize, access, logger);

      return syncTransaction(sequelize, items, async (item, transaction) => {
        const dining = await addUpdateDining(item, Location, access, transaction, logger);
        return api.get(dining);
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
