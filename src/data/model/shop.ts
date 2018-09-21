import invariant from 'invariant';
import pick from 'lodash/pick'; // tslint:disable-line
import { IShop } from '../../types';
import { syncTransaction, upsert } from '../utils';
import location from './location';

// Note: returning extId for jobs
const RAW_SHOP_ATTRIBUTES = [
  'admissionRequired',
  'description',
  'extId',
  'id',
  'name',
  'type',
  'url',
  'locationId',
  'areaId',
  'wheelchairAccessible'
];

const normalizeShop = shop => ({
  ...pick(shop, RAW_SHOP_ATTRIBUTES),
  tags: shop.ShopTags.map(tag => tag.name)
});

const addUpdateShop = async (item: IShop, Location, access, transaction, logger) => {
  logger('debug', `Adding/updating shops ${item.extId}.`);
  const { Shop, Tag } = access;
  const shopItem: any = {
    admissionRequired: item.admissionRequired,
    description: item.description,
    extId: item.extId,
    extRefName: item.extRefName,
    name: item.name,
    type: item.type,
    url: item.url,
    wheelchairAccessible: item.wheelchairAccessible
  };

  if (item.id) {
    shopItem.id = item.id;
  }

  const shopInst = await upsert(
    Shop, shopItem, { extId: item.extId }, transaction
  );

  if (item.location) {
    const locationInstance = await Location.findByName(item.location, transaction);
    if (locationInstance) {
      await shopInst.setLocation(locationInstance, { transaction });
    }
    // we have to add the area here because there is no other way
    // to easily generate them
    if (item.area) {
      const locationId = locationInstance.get('id');
      let areaInst =
        await Location.findAreaByName(locationId, item.area, transaction);

      if (!areaInst) {
        areaInst = await Location.addArea(locationId, item.area, transaction);
      }

      await shopInst.setArea(areaInst, { transaction });
    }
  }

  if (item.tags) {
    for (const tagName of item.tags) {
      const tagInst = await upsert(
        Tag, { name: tagName, from: 'shop' }, { name: tagName }, transaction
      );
      if (!await shopInst.hasShopTags(tagInst)) {
        await shopInst.addShopTags(tagInst, { transaction });
      }
    }
  }

  logger('debug', `Finished adding/updating shop ${item.extId}.`);
  return shopInst.get('id');
};

/**
 * Validates a single shop.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateShop = (item: IShop) => {
  if (!item.type) {
    return 'Type is required for shops.';
  }

  if (!item.extId) {
    return 'ExtId is required for shops.';
  }

  return true;
};

/**
 * Validates all shops.
 * @param items
 */
export const validateAllShops = (items: IShop[]) => {
  if (!items || !items.length) {
    return 'Shops are required to add or update.';
  }
  const errors = items
    .map(validateShop)
    .filter(error => typeof error === 'string');

  return errors.length ? errors : true;
};

export default (sequelize, access, logger) => {
  const api = {
    async addUpdate(items: IShop[] = []) {
      const Location = location(sequelize, access, logger);

      // TODO: Make more sense to do the get outside of the transction? if the
      // get fails, the whole transaction is going to roll back
      return syncTransaction(sequelize, items, async (item, transaction) => {
        const shop = await addUpdateShop(item, Location, access, transaction, logger);
        return api.get(shop);
      });
    },
    /**
     * Returns a raw shop by id.
     * @param id
     */
    async get(id: string) {
      const { Shop, Tag } = access;
      // setting to any because I am not gonna repeat sequelize's api
      const queryInclude: any[] = [{
        as: 'ShopTags',
        attributes: ['name'],
        model: Tag
      }];

      const found = await Shop.findOne(
        {
          attributes: RAW_SHOP_ATTRIBUTES,
          include: queryInclude,
          where: { id }
        }
      );

      if (!found) {
        // let the caller handle not found
        return null;
      }

      const raw = found.get({ plain: true });
      return normalizeShop(raw);
    },
    /**
     * List all shops
     * @param where - search parameters
     */
    async list(where?: { [key: string]: string | boolean }) {
      const { Shop, Tag } = access;
      let query: { attributes: string[], include: any[], where?: any } = {
        attributes: RAW_SHOP_ATTRIBUTES,
        include: [{
          as: 'ShopTags',
          attributes: ['name'],
          model: Tag
        }]
      };

      if (where) {
        invariant(
          Object.keys(where).length, 'Conditions are required when searching for shops.'
        );

        query = {
          ...query,
          where
        };
      }

      const found = Shop.findAll(query);

      return found.map(item => {
        // need to further normalize
        const raw = item.get({ plain: true });
        return normalizeShop(raw);
      });
    }
  };

  return api;
};
