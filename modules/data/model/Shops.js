"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const utils_1 = require("../utils");
const Shop_1 = require("./Shop");
class Shops {
    constructor(sequelize, access, logger, models) {
        this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.models = models;
    }
    /**
     * Bulk upsert shops.
     * @param items
     */
    async bulkAddUpdate(items = []) {
        const shops = await utils_1.syncTransaction(this.sequelize, items, async (item, transaction) => {
            // create a model for this shop,
            const shop = this.createShop(item.id || item.extId);
            // update it with the latest coming in and return the id for now
            const id = await shop.upsert(item, transaction);
            return id;
        });
        return { [utils_1.Success]: shops };
    }
    /**
     * Factory for creating a shop model.
     * @param item
     */
    createShop(id) {
        invariant_1.default(id, 'Id is required to create a shop.');
        const { Shop } = this.models;
        return new Shop(this.sequelize, this.dao, this.logger, this.models, id);
    }
    /**
     * Retrieves a shop.
     * @param id
     * @returns - Returns a Shop model with the data loaded or null if not found
     */
    async findById(id) {
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
    async list(where) {
        const { Tag } = this.dao;
        const { Shop } = this.models;
        let query = {
            attributes: Shop_1.RAW_SHOP_ATTRIBUTES,
            include: [{
                    as: 'ShopTags',
                    attributes: ['name'],
                    model: Tag
                }]
        };
        if (where) {
            invariant_1.default(Object.keys(where).length, 'Conditions are required when searching for shops.');
            query = Object.assign({}, query, { where });
        }
        const found = this.dao.Shop.findAll(query);
        // create new shop objects then parse the data
        return found.map(item => {
            const shop = new Shop(this.sequelize, this.dao, this.logger, this.models, item);
            return shop.data;
        });
    }
}
exports.default = Shops;
//# sourceMappingURL=Shops.js.map