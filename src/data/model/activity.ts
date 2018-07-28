import { IAttraction } from '../../types';
import { syncTransaction, upsert } from '../utils';
import date from './date';

export default (sequelize, access) => {
  return {
    async addUpdateActivities(items: IAttraction[] = []) {
      const { Activity, Age, Location, Tag, ThrillFactor } = access;

      return syncTransaction(sequelize, items, async (item, t) => {
        const activityItem: any = {
          admissionRequired: item.restrictions.admissionRequired,
          allowServiceAnimals: item.restrictions.allowServiceAnimals,
          description: item.description,
          extId: item.extId,
          extRefName: item.extRefName,
          fastPass: item.fastPass,
          fastPassPlus: item.fastPassPlus,
          height: item.restrictions.height,
          latitude: item.coordinates ? item.coordinates.gps.latitude : null,
          longitude: item.coordinates ? item.coordinates.gps.longitude : null,
          name: item.name,
          riderSwapAvailable: item.riderSwapAvailable,
          type: item.type,
          url: item.url,
          wheelchairTransfer: item.restrictions.wheelchairTransfer
        };
        if (item.id) {
          activityItem.id = item.id;
        }

        const activityInstance = await upsert(
          Activity, activityItem, { extId: item.extId }, t
        );
        if (item.location) {
          const locationInstance = await Location.findOne(
            { where: { name: item.location } }, { transaction: t }
          );
          if (locationInstance) {
            await activityInstance.setLocation(locationInstance, { transaction: t });
          }
          // TODO: else log an issue if we cannot find a location
        }
        // check thrill factors
        if (item.thrillFactor) {
          // either sync or async with Promise.all
          for (const factor of item.thrillFactor) {
            const thrillInstance = await upsert(
              ThrillFactor, { name: factor }, { name: factor }, t
            );
            if (!await activityInstance.hasThrillFactors(thrillInstance)) {
              await activityInstance.addThrillFactors(thrillInstance, { transaction: t });
            }
          }
        }

        if (item.ages) {
          // either sync or async with Promise.all
          for (const ageName of item.ages) {
            const ageInstance = await upsert(
              Age, { name: ageName }, { name: ageName }, t
            );
            if (!await activityInstance.hasActivityAges(ageInstance)) {
              await activityInstance.addActivityAges(ageInstance, { transaction: t });
            }
          }
        }

        if (item.tags) {
          // either sync or async with Promise.all
          for (const tagName of item.tags) {
            const tagInstance = await upsert(
              Tag, { name: tagName }, { name: tagName }, t
            );
            if (!await activityInstance.hasActivityTags(tagInstance)) {
              await activityInstance.addActivityTags(tagInstance, { transaction: t });
            }
          }
        }

        return activityInstance;
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
    }
  };
};
