import { expect } from 'chai';
import 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import { spy, stub } from 'sinon';
import uuid from 'uuid/v4'; // tslint:disable-line
import { IShop } from '../../../src/types';
import {
  createShopInstance,
  MockLocation,
  mockLocationDao,
  MockLocations,
  mockLogger,
  mockShopDao,
  mockShopDiscountDao
} from './utils';

const mockAreaInstance = {

};

const mockTransaction = {};

class MockDiscount {
  private discount: any;
  constructor(discount) {
    this.discount = discount;
  }

  public get() {
    return this.discount;
  }
}

describe('model - shop', () => {
  describe('create and find', () => {
    it('should create a new instance with extId', async () => {
      const upsertStub = stub().returns(mockShopDao);
      const Shop = proxyquire(
        '../../../src/data/model/Shop',
        { '../utils': { upsert: upsertStub } }
      );

      const id = uuid();
      const data = { id, name: 'Foo', ShopTags: [] };

      const getMockShopStub = stub(mockShopDao, 'findOne').returns(createShopInstance(id, data));
      const access = {
        Shop: mockShopDao,
        ShopDiscount: mockShopDiscountDao
      };
      const models = { Locations: MockLocations };
      const shop = new Shop.default({}, access, mockLogger, models, '123');
      expect(shop.id).to.equal('123');
      expect(shop.isExt).to.equal(true);
      expect(shop.idKey).to.equal('extId');

      const found = await shop.load();
      expect(found).to.equal(true);
      // expect(shop.instance instanceof InstanceShop).to.equal(true);
      expect(shop.id).to.equal(id);
      expect(shop.isExt).to.equal(false);
      expect(shop.idKey).to.equal('id');
      expect(shop.data).to.deep.equal({ id, name: 'Foo', tags: [] });

      getMockShopStub.restore();
    });

    it('should create a new instance with internal id', async () => {
      const upsertStub = stub().returns(mockShopDao);
      const Shop = proxyquire(
        '../../../src/data/model/Shop',
        { '../utils': { upsert: upsertStub } }
      );

      const id = uuid();
      const data = { id, name: 'Foo', ShopTags: [{ name: 'fun' }] };

      const getMockShopStub = stub(mockShopDao, 'findOne').returns(createShopInstance(id, data));
      const access = {
        Shop: mockShopDao,
        ShopDiscount: mockShopDiscountDao
      };

      const models = { Locations: MockLocations };
      const shop = new Shop.default({}, access, mockLogger, models, id);
      expect(shop.id).to.equal(id);
      expect(shop.isExt).to.equal(false);
      expect(shop.idKey).to.equal('id');
      const found = await shop.load();
      expect(found).to.equal(true);
      // expect(shop.instance instanceof InstanceShop).to.equal(true);
      expect(shop.id).to.equal(id);
      expect(shop.isExt).to.equal(false);
      expect(shop.idKey).to.equal('id');
      expect(shop.data).to.deep.equal({ id, name: 'Foo', tags: ['fun'] });

      getMockShopStub.restore();
    });
  });

  describe('upsert', () => {
    it('should add a shop', async () => {
      const mockShopDiscount = {
        create: spy(),
        findAll: stub().returns([])
      };

      // setup our stubs and spies
      const getMockShopStub = stub(mockShopDao, 'get').returns('123-456');
      const upsertStub = stub().returns(mockShopDao);
      const findByNameLocationStub = stub(MockLocation.prototype, 'findByName')
        .returns(mockLocationDao);

      const Shop = proxyquire(
        '../../../src/data/model/Shop',
        { '../utils': { upsert: upsertStub } }
      );

      const access = {
        Shop: mockShopDao,
        ShopDiscount: mockShopDiscount
      };

      const item: IShop = {
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
      };

      const models = { Locations: MockLocations };
      const shop = new Shop.default({}, access, mockLogger, models, '123');

      const output = await shop.upsert(item, mockTransaction);

      // this not really what gets returned in prod
      expect(output).to.deep.equal('123-456');

      expect(upsertStub.called).to.equal(true);
      const firstCall = upsertStub.getCall(0);
      expect(firstCall.args[1]).to.deep.equal({
        admissionRequired: true,
        description: '',
        extId: '123',
        extRefName: 'Fun',
        name: 'Fun',
        type: 'merchant',
        url: 'http://balls.com',
        wheelchairAccessible: true
      });
      expect(firstCall.args[2]).to.deep.equal({ extId: '123' });

      expect(mockShopDiscount.create.callCount).to.equal(1);
      expect(mockShopDiscount.create.firstCall.args[0]).to.deep.equal({
        description: 'woot',
        discount: '30%',
        fromDate: moment().format('YYYY-MM-DD'),
        shopId: '123-456',
        thruDate: null,
        type: 'passholder'
      });

      getMockShopStub.restore();
      findByNameLocationStub.restore();
    });

    it('should update discounts', async () => {
      const getMockShopStub = stub(mockShopDao, 'get').returns('123-456');
      const upsertStub = stub().returns(mockShopDao);
      const findByNameLocationStub = stub(MockLocation.prototype, 'findByName')
        .returns(mockLocationDao);
      const createShopDiscountStub = spy(mockShopDiscountDao, 'create');
      const findAllShopDiscountStub = stub(mockShopDiscountDao, 'findAll').returns([
        new MockDiscount({
          description: 'woot',
          discount: '30%',
          fromDate: moment().format('YYYY-MM-DD'),
          id: '1',
          shopId: '123-456',
          thruDate: null,
          type: 'passholder'
        })
      ]);

      const Shop = proxyquire(
        '../../../src/data/model/Shop',
        { '../utils': { upsert: upsertStub } }
      );

      const removedDiscountsShopStub = stub(Shop.default, 'removedDiscounts');
      const updateDiscountsShopStub = stub(Shop.default, 'updateDiscounts');

      const access = {
        Shop: mockShopDao,
        ShopDiscount: mockShopDiscountDao
      };

      const item: IShop = {
        admissionRequired: true,
        area: 'Bar',
        description: '',
        discounts: [{
          description: 'woot',
          discount: '40%',
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
      };

      const models = { Locations: MockLocations };
      const shop = new Shop.default({}, access, mockLogger, models, '123');

      const output = await shop.upsert(item, mockTransaction);

      // this not really what gets returned in prod
      expect(output).to.deep.equal('123-456');

      expect(upsertStub.called).to.equal(true);
      const firstCall = upsertStub.getCall(0);
      expect(firstCall.args[1]).to.deep.equal({
        admissionRequired: true,
        description: '',
        extId: '123',
        extRefName: 'Fun',
        name: 'Fun',
        type: 'merchant',
        url: 'http://balls.com',
        wheelchairAccessible: true
      });
      expect(firstCall.args[2]).to.deep.equal({ extId: '123' });

      expect(createShopDiscountStub.callCount).to.equal(0);
      expect(removedDiscountsShopStub.callCount).to.equal(0);
      expect(updateDiscountsShopStub.callCount).to.equal(1);

      getMockShopStub.restore();
      findByNameLocationStub.restore();
      findAllShopDiscountStub.restore();
      createShopDiscountStub.restore();
      removedDiscountsShopStub.restore();
    });
  });
});
