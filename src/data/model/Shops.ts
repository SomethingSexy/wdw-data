import invariant from 'invariant';
import { ILogger, IShop, IShopsModels } from '../../types';
import { syncTransaction } from '../utils';
import { normalizeShop, RAW_SHOP_ATTRIBUTES } from './Shop';

class Shops {
  private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private models: IShopsModels;

  constructor(sequelize, access, logger, models: IShopsModels) {
    this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.models = models;
  }

  /**
   * Bulk upsert shops.
   * @param items
   */
  public async bulkAddUpdate(items: IShop[] = []) {
    return syncTransaction(this.sequelize, items, async (item, transaction) => {
      // create a model for this shop,
      const shop = this.createShop(item.id || item.extId);
      // update it with the latest coming in
      await shop.upsert(item, transaction);
      // then retrieve the data
      return shop.data;
    });
  }

  /**
   * Factory for creating a shop model.
   * @param item
   */
  public createShop(id: string) {
    invariant(id, 'Id is required to create a shop.');
    const { Shop } = this.models;
    return new Shop(this.sequelize, this.dao, this.logger, this.models, id);
  }

  /**
   * Retrieves a shop.
   * @param id
   * @returns - Returns a Shop model with the data loaded or null if not found
   */
  public async findById(id: string) {
    const shop = this.createShop(id);
    const loaded = await shop.load();

    if (!loaded) {
      return null;
    }

    return shop;
  }

  /**
   * List all shops
   * @param where - search parameters
   */
  public async list(where?: { [key: string]: string | boolean }) {
    const { Shop, Tag } = this.dao;
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
}

export default Shops;
