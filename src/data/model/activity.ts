import invariant from 'invariant';
import { IAttraction, ISchedule } from '../../types';
import { syncTransaction, upsert } from '../utils';
import date from './date';
import location from './location';

export const types = {
  ENTERTAINMENT: 'entertainment'
};

export default (sequelize, access, logger) => {
  const api = {
    async addSchedule(
      activityId: string, scheduleDate: string, parkSchedules, transaction
    ) {
      const { Schedule } = access;

      const DateModel = date(sequelize, access);
      const dateInstance = await DateModel.get(scheduleDate, transaction);

      // TODO: Check to see if we already have a schedule for that day
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
      return Promise.all(
        Object
          .entries(schedules)
          .map(([key, value]) => {
            return sequelize.transaction(t => {
              return api.addSchedule(id, key, value, t);
            });
          })
        );
    },
    async addUpdateActivities(items: IAttraction[] = []) {
      const { Activity, Age, Tag, ThrillFactor } = access;
      const Location = location(sequelize, access, logger);

      return syncTransaction(sequelize, items, async (item, t) => {
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
          Activity, activityItem, { extId: item.extId }, t
        );

        if (item.location) {
          const locationInstance = await Location.findByName(item.location, t);
          if (locationInstance) {
            await activityInst.setLocation(locationInstance, { transaction: t });
          }
          // TODO: else log an issue if we cannot find a location
          // if there is a location, we might also have an area, however
          // we have to add the area here because there is no other way
          // to easily generate them
          if (item.area) {
            const locationId = locationInstance.get('id');
            let areaInst =
              await Location.findAreaByName(locationId, item.area, t);

            if (!areaInst) {
              areaInst = await Location.addArea(locationId, item.area, t);
            }

            await activityInst.setArea(areaInst, { transaction: t });
          }
        }

        // check thrill factors
        if (item.thrillFactor) {
          // either sync or async with Promise.all
          for (const factor of item.thrillFactor) {
            const thrillInst = await upsert(
              ThrillFactor, { name: factor }, { name: factor }, t
            );
            if (!await activityInst.hasThrillFactors(thrillInst)) {
              await activityInst.addThrillFactors(thrillInst, { transaction: t });
            }
          }
        }

        if (item.ages) {
          // either sync or async with Promise.all
          for (const ageName of item.ages) {
            const ageInst = await upsert(
              Age, { name: ageName }, { name: ageName }, t
            );
            if (!await activityInst.hasActivityAges(ageInst)) {
              await activityInst.addActivityAges(ageInst, { transaction: t });
            }
          }
        }

        if (item.tags) {
          // either sync or async with Promise.all
          for (const tagName of item.tags) {
            const tagInst = await upsert(
              Tag, { name: tagName }, { name: tagName }, t
            );
            if (!await activityInst.hasActivityTags(tagInst)) {
              await activityInst.addActivityTags(tagInst, { transaction: t });
            }
          }
        }

        return activityInst;
      });
    },
    async addWaitTimes(timestamp: string, items = []) {
      const { Activity, WaitTime } = access;
      const DateModel = date(sequelize, access);

      return syncTransaction(sequelize, items, async (item, transaction) => {
        const { extId, waitTime } = item;  // tslint:disable-line
        const activityInstance = await Activity.findOne(
          { where: { extId } }, { transaction }
        );

        if (!activityInstance) {
          return Promise.resolve(false); // TODO log
        }

        const dateInstance = await DateModel.get(timestamp, transaction);

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
     * List all activities
     * @param where - search parameters
     */
    async list(where?: { [key: string]: string | boolean }) {
      const { Activity } = access;
      if (where) {
        invariant(
          Object.keys(where).length, 'Conditions are required when searching for activities.'
        );

        return Activity.findAll({ where, raw: true });
      }
      return Activity.all({ raw: true });
    }
  };

  return api;
};
