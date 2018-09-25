import { expect } from 'chai';
import 'mocha';
import nock from 'nock';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';
import { IShop } from '../../../src/types';

const mockLogger = (type: string, message: string) => {}; // tslint:disable-line

const mockLocationInstance = {
  get: stub()
};

const mockAreaInstance = {

};

const MockLocation = {
  addArea: stub(),
  findAreaByName: stub().returns(mockAreaInstance),
  findByName: stub().returns(mockLocationInstance),
};

const mockTransaction = {};

describe('model - shop', () => {
  describe('addUpdateShop', () => {
    it('should add a shop', async () => {
      const mockShop = {
        addShopTags: stub(),
        findOne: stub(),
        get: stub().returns({ balls: 1 }),
        hasShopTags: stub(),
        setArea: stub(),
        setLocation: stub()
      };

      const upsertStub = stub().returns(mockShop);

      const shop = proxyquire(
        '../../../src/data/model/shop',
        { '../utils': { syncTransaction: () => {}, upsert: upsertStub } }
      );
      const access = {
        Shop: mockShop
      };

      const item: IShop = {
        admissionRequired: true,
        area: 'Bar',
        description: '',
        // discounts?: IShopDiscount[];
        extId: '123',
        extRefName: 'Fun',
        // id: string;
        location: 'Foo',
        name: 'Fun',
        tags: ['woot'],
        type: 'merchant',
        url: 'http://balls.com',
        wheelchairAccessible: true
      };

      const output = await shop.addUpdateShop(
        item, MockLocation, access, mockTransaction, mockLogger
      );

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
    });
  });
});
