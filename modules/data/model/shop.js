"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const is_uuid_1 = __importDefault(require("is-uuid"));
const differenceWith_1 = __importDefault(require("lodash/differenceWith")); // tslint:disable-line
const pick_1 = __importDefault(require("lodash/pick")); // tslint:disable-line
const moment_1 = __importDefault(require("moment"));
const utils_1 = require("../utils");
// Note: returning extId for jobs
exports.RAW_SHOP_ATTRIBUTES = [
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
exports.normalizeShop = shop => (Object.assign({}, pick_1.default(shop, exports.RAW_SHOP_ATTRIBUTES), { tags: shop.ShopTags.map(tag => tag.name) }));
/**
 * Validates a single shop.  The following fields are considered
 * required: type and extId.
 * @param item
 */
const validateShop = (item) => {
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
exports.validateAllShops = (items) => {
    if (!items || !items.length) {
        return 'Shops are required to add or update.';
    }
    const errors = items
        .map(validateShop)
        .filter(error => typeof error === 'string');
    return errors.length ? errors : true;
};
class ShopModel {
    /**
     *
     * @param sequelize
     * @param access
     * @param logger
     * @param models
     * @param id - string id or instance
     */
    constructor(sequelize, access, logger, models, id) {
        this._id = '';
        this.isExt = false;
        this.idKey = 'id';
        this.instance = null;
        invariant_1.default(id, 'Internal or external id is required to create a Shop.');
        this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.models = models;
        if (typeof id === 'string') {
            this.id = id;
            this.instance = null;
        }
        else {
            // we are assuming instance for now
            this.instance = id;
            this.id = this.instance.get('id');
        }
    }
    static async createDiscounts(Model, discounts, shopId, transaction) {
        return Promise.all(discounts.map(async (discount) => Model.create({
            description: discount.description,
            discount: discount.discount,
            fromDate: moment_1.default().format('YYYY-MM-DD'),
            shopId,
            thruDate: null,
            type: discount.type
        }, { transaction })));
    }
    /**
     * Turns off the discount by updating the thruDate.
     * @param Model
     * @param discounts
     * @param transaction
     */
    static async removedDiscounts(Model, discounts, transaction) {
        return Promise.all(discounts.map(async (discount) => {
            const instance = await Model.findById(discount.id, { transaction });
            return instance.update({ thruDate: moment_1.default().format('YYYY-MM-DD') });
        }));
    }
    /**
     * Updates existing discounts.
     *
     * @param Model
     * @param discounts
     * @param transaction
     */
    static async updateDiscounts(Model, discounts, transaction) {
        return Promise.all(discounts.map(async (discount) => {
            const instance = await Model.findById(discount.id, { transaction });
            return instance.update(pick_1.default(discount, ['discount', 'description']));
        }));
    }
    set id(id) {
        this._id = id;
        this.isExt = !is_uuid_1.default.v4(id);
        this.idKey = this.isExt ? 'extId' : 'id';
    }
    get id() {
        return this._id;
    }
    get locations() {
        // TODO: Figure out why I need any here
        const Locations = this.models.Locations;
        return new Locations(this.sequelize, this.dao, this.logger, this.models);
    }
    get data() {
        // if no instance, throw an error
        invariant_1.default(this.instance, 'An instance is required to retrieve data, call load first.');
        const raw = this.instance.get({ plain: true });
        return exports.normalizeShop(raw);
    }
    /**
     * Fetches and loads the instance
     *
     * @returns - true if found, false if not found
     */
    async load() {
        const { Shop, Tag } = this.dao;
        // setting to any because I am not gonna repeat sequelize's api
        const queryInclude = [{
                as: 'ShopTags',
                attributes: ['name'],
                model: Tag
            }];
        const query = {
            attributes: exports.RAW_SHOP_ATTRIBUTES,
            include: queryInclude,
            where: { [this.idKey]: this.id }
        };
        if (this.instance) {
            await this.instance.reload(query);
        }
        else {
            this.instance = await Shop.findOne(query);
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
     * Handles bulk create or update from outside sources.
     * @param item
     * @param transaction
     */
    async upsert(item, transaction) {
        this.logger('debug', `Adding/updating shops ${item.extId}.`);
        const Locations = this.locations;
        const { Shop, ShopDiscount, Tag } = this.dao;
        const shopItem = {
            admissionRequired: item.admissionRequired,
            description: item.description,
            extId: item.extId,
            extRefName: item.extRefName,
            name: item.name,
            type: item.type,
            url: item.url,
            wheelchairAccessible: item.wheelchairAccessible
        };
        // right now this will always exist
        shopItem[this.idKey] = this.id;
        const shopInst = await utils_1.upsert(Shop, shopItem, { [this.idKey]: this.id }, transaction);
        if (item.location) {
            const location = await Locations.findByName(item.location, transaction);
            if (location) {
                await shopInst.setLocation(location.instance, { transaction });
                // we have to add the area here because there is no other way
                // to easily generate them
                if (item.area) {
                    let areaInst = await location.findAreaByName(item.area, transaction);
                    if (!areaInst) {
                        areaInst = await location.addArea(item.area, transaction);
                    }
                    await shopInst.setArea(areaInst, { transaction });
                }
            }
        }
        if (item.tags) {
            for (const tagName of item.tags) {
                const tagInst = await utils_1.upsert(Tag, { name: tagName, from: 'shop' }, { name: tagName }, transaction);
                if (!await shopInst.hasShopTags(tagInst)) {
                    await shopInst.addShopTags(tagInst, { transaction });
                }
            }
        }
        // if this is null, then we are assuming we do not have any updates
        // if it is an empty discount then that means we need to clear out
        // all existing discounts
        if (item.discounts) {
            this.logger('debug', `Shop ${item.extId} has ${item.discounts.length} discounts.`);
            // get all current discounts
            // if incoming discounts is empty, clear them out
            // if incoming is not empty, see if there are any updates
            const activeDiscounts = await ShopDiscount
                .findAll({ where: { shopId: shopInst.get('id'), thruDate: null } }, { transaction })
                .map(discount => discount.get({ plain: true }));
            this.logger('debug', `Shop ${item.extId} has ${activeDiscounts.length} active discounts.`);
            if (activeDiscounts.length && !item.discounts.length) {
                // we have active discounts but we do not have any now... remove the current ones
                await Promise.all(activeDiscounts
                    .map(async (discount) => ShopModel.removedDiscounts(ShopDiscount, discount, transaction)));
            }
            else if (activeDiscounts.length && item.discounts.length) {
                // we have active discounts and we have incoming ones
                // find the ones that do not exist, close them down
                // find the ones that still eixst, ignore
                // add new ones
                const add = differenceWith_1.default(item.discounts, activeDiscounts, (incoming, active) => {
                    if (incoming.type !== active.type && incoming.discount !== active.discount) {
                        return false;
                    }
                    return true;
                });
                // remove based on type only, description and discount can change
                const remove = activeDiscounts.filter(active => !(item.discounts || [])
                    .find(discount => discount.type === active.type));
                const update = activeDiscounts.reduce((all, active) => {
                    const shouldUpdate = (item.discounts || [])
                        .find(discount => discount.type === active.type
                        && (discount.discount !== active.discount
                            || discount.description !== active.description));
                    // If we found one, merge the new props with the old, so we can update later
                    if (shouldUpdate) {
                        return [
                            ...all,
                            Object.assign({}, active, shouldUpdate)
                        ];
                    }
                    return all;
                }, []);
                if (add.length) {
                    await ShopModel.createDiscounts(ShopDiscount, add, shopInst.get('id'), transaction);
                }
                if (remove.length) {
                    // TODO: If we keep the instance, might be easier to update?
                    await ShopModel.removedDiscounts(ShopDiscount, remove, transaction);
                }
                if (update.length) {
                    await ShopModel.updateDiscounts(ShopDiscount, update, transaction);
                }
            }
            else if (!activeDiscounts.length && item.discounts.length) {
                // we do not have active discounts and we have incoming ones, add
                await ShopModel.createDiscounts(ShopDiscount, item.discounts, shopInst.get('id'), transaction);
            }
        }
        this.logger('debug', `Finished adding/updating shop ${item.extId}.`);
        // set the instance after we created,
        // TODO: Should we call update on existing instance if we already have it?
        this.instance = shopInst;
        // return the id of the shop we created/updated
        return shopInst.get('id');
    }
}
exports.default = ShopModel;
//# sourceMappingURL=Shop.js.map