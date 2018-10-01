import { expect } from 'chai';
import 'mocha';
import { spy, stub } from 'sinon';
import Shop from '../../../src/data/model/Shop';
import Shops from '../../../src/data/model/Shops';
import { IShop } from '../../../src/types';
import {
  MockLocation,
  mockLogger,
  mockSequelize,
  MockShop,
  mockShopDao,
  mockShopDiscountDao
} from './utils';

describe('model - shops', () => {
  describe('bulkAddUpdate', () => {
    it('should handle adding/updating shops', async () => {
      const models = { Location: MockLocation, Shop: MockShop };
      const access = {
        Shop: mockShopDao,
        ShopDiscount: mockShopDiscountDao
      };

      const mockShop = new MockShop();
      const shopUpsertSpy = stub(mockShop, 'upsert');
      mockShop.data = spy();

      const createShopStub = stub(Shops.prototype, 'createShop').returns(mockShop);

      const shops = new Shops(mockSequelize, access, mockLogger, models);

      const items: IShop[] = [{
        admissionRequired: true,
        area: 'Bar',
        description: '',
        discounts: [{
          description: 'woot',
          discount: '30%',
          type: 'passholder'
        }],
        extId: '123',
        extRefName: 'Fun',
        location: 'Foo',
        name: 'Fun',
        tags: ['woot'],
        type: 'merchant',
        url: 'http://balls.com',
        wheelchairAccessible: true
      }];

      await shops.bulkAddUpdate(items);
      expect(shopUpsertSpy.callCount).to.equal(1);
      expect(createShopStub.callCount).to.equal(1);
      // expect(mockShop.data.callCount).to.equal(1);

      shopUpsertSpy.restore();
      createShopStub.restore();
    });
  });

  describe('createShop', () => {
    it('should handle creating a shop', () => {
      const models = { Shop, Location: MockLocation };
      const shops = new Shops(mockSequelize, {}, mockLogger, models);
      const shop = shops.createShop('123');
      expect(shop instanceof Shop).to.equal(true);
      expect(shop.id).to.equal('123');
    });
  });

  describe('findById', () => {
    it('should handle finding a shop by extId', async () => {
      const models = { Shop, Location: MockLocation };
      const mockShop = new MockShop();
      const loadSpy = spy(mockShop, 'load');

      const createShopStub = stub(Shops.prototype, 'createShop').returns(mockShop);
      const shops = new Shops(mockSequelize, {}, mockLogger, models);
      const shop = await shops.findById('123');

      expect(shop instanceof MockShop).to.equal(true);
      expect(loadSpy.callCount).to.equal(1);

      createShopStub.restore();
      loadSpy.restore();
    });

    it('should handle finding a shop by id', () => {

    });
  });
});
