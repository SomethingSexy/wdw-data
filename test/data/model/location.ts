import { expect } from 'chai';
import 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import { spy, stub } from 'sinon';
import uuid from 'uuid/v4'; // tslint:disable-line
import LocationModel from '../../../src/data/model/Location';
import { IShop } from '../../../src/types';

import {
  createLocationInstance,
  mockActivityDao,
  mockAddressDao,
  mockAreaDao,
  MockLocation,
  mockLocationDao,
  mockLogger
} from './utils';

const mockAreaInstance = {

};

const mockTransaction = {};

describe('model - location', () => {
  describe('create and find', () => {
    it('should create a new instance and load it via extId', async () => {
      const id = uuid();
      const data = {
        Address: {
          city: 'Foo',
          number: '123',
          plus4: '4567',
          prefix: '',
          state: 'WI',
          street: 'Bar',
          type: 'Street',
          zip: '11111'
        },
        Areas: [{ name: 'fun' }],
        id, // tslint:disable-line
        name: 'Foo'
      };

      const findOneMockLocationStub = stub(mockLocationDao, 'findOne')
        .returns(createLocationInstance(id, data));
      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };

      const location = new LocationModel({}, access, mockLogger, '123');
      expect(location.id).to.equal('123');

      const found = await location.load();
      expect(found).to.equal(true);
      expect(location.id).to.equal(id);
      expect(location.data).to.deep.equal({
        address: {
          city: 'Foo',
          number: '123',
          plus4: '4567',
          prefix: '',
          state: 'WI',
          street: 'Bar',
          type: 'Street',
          zip: '11111'
        },
        areas: ['fun'],
        id,
        name: 'Foo'
      });
      expect(findOneMockLocationStub.callCount).to.equal(1);
      expect(findOneMockLocationStub.args[0][0]).to.deep.equal({
        attributes: ['id', 'name', 'description', 'type', 'url', 'extId'],
        include: [{
          as: 'Address',
          attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
          model: mockAddressDao
        }, {
          as: 'Areas',
          attributes: ['name'],
          model: mockAreaDao
        }],
        where: { extId: '123' }
      });

      findOneMockLocationStub.restore();
    });

    it('should find an existing with internal id', async () => {
      const id = uuid();
      const data = {
        Areas: [],
        id, // tslint:disable-line
        name: 'Foo'
      };

      const findOneMockLocationStub = stub(mockLocationDao, 'findOne')
        .returns(createLocationInstance(id, data));
      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };

      const location = new LocationModel({}, access, mockLogger, id);
      expect(location.id).to.equal(id);

      const found = await location.load();
      expect(found).to.equal(true);
      expect(location.id).to.equal(id);
      expect(location.data).to.deep.equal({
        address: null,
        areas: [],
        id,
        name: 'Foo'
      });
      expect(findOneMockLocationStub.callCount).to.equal(1);
      expect(findOneMockLocationStub.args[0][0]).to.deep.equal({
        attributes: ['id', 'name', 'description', 'type', 'url', 'extId'],
        include: [{
          as: 'Address',
          attributes: ['city', 'number', 'state', 'plus4', 'prefix', 'street', 'type', 'zip'],
          model: mockAddressDao
        }, {
          as: 'Areas',
          attributes: ['name'],
          model: mockAreaDao
        }],
        where: { id }
      });

      findOneMockLocationStub.restore();
    });

    it('should not find a location with additional queries', async () => {

    });

    it('should not find a location', async () => {

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
        '../../../src/data/model/shop',
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

      const models = { Location: MockLocation };
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
        '../../../src/data/model/shop',
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

      const models = { Location: MockLocation };
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
