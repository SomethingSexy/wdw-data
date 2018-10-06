import { expect } from 'chai';
import 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import sinon, { fake, spy, stub } from 'sinon';
import uuid from 'uuid/v4'; // tslint:disable-line
import LocationModel, { GetTypes } from '../../../src/data/model/Location';
import { Success } from '../../../src/data/utils';
import { ILocation } from '../../../src/types';
import {
  createDateInstance,
  createHotelInstance,
  createLocationInstance,
  createScheduleInstance,
  mockActivityDao,
  mockAddressDao,
  mockAreaDao,
  MockDate,
  mockLocationDao,
  mockLocationScheduleDao,
  mockLogger,
  mockScheduleDao,
  mockSequelize,
  mockTransaction,
} from './utils';

const mockAreaInstance = {

};

const schedules = {
  '2018/30/1': [{
    closing: '23:00',
    isSpecialHours: false,
    opening: '10:00',
    type: 'stuff'
  }],
  '2018/30/2': [{
    closing: '23:00',
    isSpecialHours: false,
    opening: '10:00',
    type: 'stuff'
  }]
};

describe('model - park', () => {
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
      const models = {
        Date: null
      };

      const location = new LocationModel({}, access, mockLogger, models, '123');
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
        id, // tslint:disable-line
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

      sinon.restore();
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
      const models = {
        Date: null
      };

      const location = new LocationModel({}, access, mockLogger, models, id);
      expect(location.id).to.equal(id);

      const found = await location.load();
      expect(found).to.equal(true);
      expect(location.id).to.equal(id);
      expect(location.data).to.deep.equal({
        address: null,
        areas: [],
        id, // tslint:disable-line
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

      sinon.restore();
    });

    it('should find a location with additional queries', async () => {
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
      const models = {
        Date: null
      };

      const location = new LocationModel({}, access, mockLogger, models, id);
      expect(location.id).to.equal(id);

      const found = await location.load([GetTypes.Activities]);
      expect(found).to.equal(true);
      expect(location.id).to.equal(id);
      expect(location.data).to.deep.equal({
        address: null,
        areas: [],
        id, // tslint:disable-line
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
        }, {
          as: 'Activities',
          attributes: ['id', 'name', 'description', 'type', 'url'],
          include: [{
            as: 'Area',
            attributes: ['name'],
            model: mockAreaDao
          }],
          model: mockActivityDao
        }],
        where: { id }
      });

      sinon.restore();
    });

    it('should not find a location', async () => {
      const id = uuid();
      const findOneMockLocationStub = stub(mockLocationDao, 'findOne')
        .returns(null);
      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };
      const models = {
        Date: null
      };

      const location = new LocationModel({}, access, mockLogger, models, id);
      expect(location.id).to.equal(id);

      const found = await location.load([GetTypes.Activities]);
      expect(found).to.equal(false);

      sinon.restore();
    });
  });

  describe('upsert', () => {
    it('should add a location', async () => {
      const id = uuid();
      const data = {
        Areas: [],
        id, // tslint:disable-line
        name: 'Foo'
      };
      const upsertFake = fake(() => createLocationInstance(id, data));
      const Location = proxyquire(
        '../../../src/data/model/Location',
        { '../utils': { upsert: upsertFake } }
      );

      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };
      const models = {
        Date: null
      };

      const location = new Location.default({}, access, mockLogger, models, '123');

      const item: ILocation = {
        extId: '123',
        extRefName: 'foo',
        name: 'Foo',
        tier: 'deluxe',
        type: 'theme-park',
        url: 'http://foo.com'
      };

      const output =  await location.upsert(item);
      expect(output).to.equal(id);
      expect(upsertFake.callCount).to.equal(1);
      expect(upsertFake.args[0][1]).to.deep.equal({ ...item, fetchSchedule: true });

      sinon.restore();
    });

    it('should add a resort with no additional data', async () => {
      const id = uuid();
      const data = {
        Areas: [],
        id, // tslint:disable-line
        name: 'Foo'
      };
      const upsertFake = fake(() => createLocationInstance(id, data));
      const Location = proxyquire(
        '../../../src/data/model/Location',
        { '../utils': { upsert: upsertFake } }
      );

      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };
      const models = {
        Date: null
      };

      const location = new Location.default({}, access, mockLogger, models, '123');

      const item: ILocation = {
        // address?: any;
        // busStops?: string[];
        // internal id
        // id?: string;
        extId: '123',
        extRefName: 'foo',
        name: 'Foo',
        // rooms?: any[];
        tier: 'deluxe',
        type: 'resort',
        url: 'http://foo.com'
      };

      const output =  await location.upsert(item);
      expect(output).to.equal(id);
      expect(upsertFake.callCount).to.equal(2);
      // first call for location
      expect(upsertFake.args[0][1]).to.deep.equal({ ...item, fetchSchedule: false });
      expect(upsertFake.args[0][4]).to.deep.equal(null);
      // second call for hotel
      expect(upsertFake.args[1][1]).to.deep.equal({ locationId: id, tier: 'deluxe' });

      sinon.restore();
    });

    it('should add a resort with additional data', async () => {
      const id = uuid();
      const hotelId = uuid();
      const data = {
        Areas: [],
        id, // tslint:disable-line
        name: 'Foo'
      };

      // const upsertFake = fake((...args) => {
      //   console.log(args);
      //   return createLocationInstance(id, data);
      // });
      const upsertFake = stub();
      upsertFake.onCall(0).returns(createLocationInstance(id, data));
      upsertFake.onCall(1).returns(createHotelInstance(hotelId, {}));
      upsertFake.onCall(2).returns(createLocationInstance(id, data));
      const Location = proxyquire(
        '../../../src/data/model/Location',
        { '../utils': { upsert: upsertFake } }
      );

      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };
      const models = {
        Date: null
      };

      const location = new Location.default({}, access, mockLogger, models, '123');

      const item: ILocation = {
        address: {
          street: '123'
        },
        // busStops?: string[];
        extId: '123',
        extRefName: 'foo',
        name: 'Foo',
        rooms: [{
          extId: 'room123'
        }],
        tier: 'deluxe',
        type: 'resort',
        url: 'http://foo.com'
      };

      const output =  await location.upsert(item);
      expect(output).to.equal(id);
      // location, hotel, room
      expect(upsertFake.callCount).to.equal(3);
      // first call for location
      expect(upsertFake.args[0][1]).to.deep.equal({ ...item, fetchSchedule: false });
      // make sure the address is getting include in the save for the location
      expect(upsertFake.args[0][4]).to.deep.equal([mockAddressDao]);
      // second call for hotel
      expect(upsertFake.args[1][1]).to.deep.equal({ locationId: id, tier: 'deluxe' });
      // third call for a room
      expect(upsertFake.args[2][1]).to.deep.equal({ hotelId, extId: 'room123' });
      expect(upsertFake.args[2][2]).to.deep.equal({ extId: 'room123' });

      sinon.restore();
    });
  });

  describe('getLocationSchedule', () => {

  });

  describe('bulkAddSchedules', () => {
    it('should add multiple schedules without the instance loaded', async () => {
      const id = uuid();
      const models = {
        Date: null
      };

      const location = new LocationModel(mockSequelize, {}, mockLogger, models, id);
      const loadFake = fake(function () {
        this.instance = createLocationInstance(id, { fetchSchedule: true });
        return true;
      });
      sinon.replace(location, 'load', loadFake);
      const addScheduleMockLocationStub = stub(location, 'addSchedule');

      const output = await location.bulkAddSchedules(schedules);
      expect(loadFake.callCount).to.equal(1);
      expect(output).to.deep.equal({ [Success]: true });
      expect(addScheduleMockLocationStub.callCount).to.equal(2);
      expect(addScheduleMockLocationStub.args[0][0]).to.equal('2018/30/1');
      expect(addScheduleMockLocationStub.args[0][1]).to.deep.equal(schedules['2018/30/1']);
      expect(addScheduleMockLocationStub.args[1][0]).to.equal('2018/30/2');
      expect(addScheduleMockLocationStub.args[1][1]).to.deep.equal(schedules['2018/30/2']);

      sinon.restore();
    });

    it('should add multiple schedules with instance loaded', async () => {
      const id = uuid();
      const models = {
        Date: null
      };
      const instance = createLocationInstance(id, { fetchSchedule: true });
      const location = new LocationModel(mockSequelize, {}, mockLogger, models, instance);
      const loadFake = fake.returns(true);
      sinon.replace(location, 'load', loadFake);
      const addScheduleMockLocationStub = stub(location, 'addSchedule');

      const output = await location.bulkAddSchedules(schedules);
      expect(loadFake.callCount).to.equal(0);
      expect(output).to.deep.equal({ [Success]: true });
      expect(addScheduleMockLocationStub.callCount).to.equal(2);
      expect(addScheduleMockLocationStub.args[0][0]).to.equal('2018/30/1');
      expect(addScheduleMockLocationStub.args[0][1]).to.deep.equal(schedules['2018/30/1']);
      expect(addScheduleMockLocationStub.args[1][0]).to.equal('2018/30/2');
      expect(addScheduleMockLocationStub.args[1][1]).to.deep.equal(schedules['2018/30/2']);

      sinon.restore();
    });

    it('should not add schedules because the location does not support it', async () => {
      const id = uuid();
      const models = {
        Date: null
      };
      const instance = createLocationInstance(id, { fetchSchedule: false });
      const location = new LocationModel(mockSequelize, {}, mockLogger, models, instance);
      const loadFake = fake.returns(true);
      sinon.replace(location, 'load', loadFake);
      const addScheduleMockLocationStub = stub(location, 'addSchedule');

      const output = await location.bulkAddSchedules(schedules);
      expect(loadFake.callCount).to.equal(0);
      expect(output).to.equal(null);
      expect(addScheduleMockLocationStub.callCount).to.equal(0);

      sinon.restore();
    });
  });

  describe('addSchedule', () => {
    it('should not add a schedule because instance cannot be found', async () => {
      const id = uuid();
      const models = {
        Date: null
      };

      const location = new LocationModel(mockSequelize, {}, mockLogger, models, id);
      const loadMockLocationStub = stub(location, 'load').returns(null);

      const output = await location.addSchedule('2018/30/1', [], mockTransaction);
      expect(output).to.equal(null);

      sinon.restore();
    });

    it('should add a schedule', async () => {
      const id = uuid();
      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao,
        LocationSchedule: mockLocationScheduleDao,
        Schedule: mockScheduleDao
      };
      const models = {
        Date: MockDate
      };
      const dateId = uuid();
      const dateData = { id: dateId };

      const dateInstance = createDateInstance(dateId, dateData);
      const addScheduleMockDateStub = stub(dateInstance, 'addSchedule');
      const loadMockDateStub = stub(MockDate.prototype, 'load');
      const dataMockDateStub = stub(MockDate.prototype, 'data').get(() => dateData);
      const instanceMockDateStub = stub(MockDate.prototype, 'instance').get(() => dateInstance);

      const createMockScheduleStub = stub(mockScheduleDao, 'create')
        .returns(createScheduleInstance('', {})) ;

      const location = new LocationModel({}, access, mockLogger, models, id);
      const loadMockLocationStub = stub(location, 'load').returns(true);

      const dateSchedule = [{
        closing: '23:00',
        isSpecialHours: false,
        opening: '10:00',
        type: 'stuff'
      }];

      const output = await location.addSchedule('2018/30/1', dateSchedule, mockTransaction);

      expect(loadMockDateStub.args[0][0]).to.equal('2018/30/1');
      expect(createMockScheduleStub.callCount).to.equal(1);
      expect(createMockScheduleStub.args[0][0]).to.deep.equal(dateSchedule[0]);
      expect(addScheduleMockDateStub.callCount).to.equal(1);
      expect(addScheduleMockDateStub.args[0][1]).to.deep.equal({
        through: { locationId: id },
        transaction: mockTransaction
      });

      sinon.restore();
    });

    it('should not add a schedule because one already exists', async () => {
      const id = uuid();
      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao,
        LocationSchedule: mockLocationScheduleDao,
        Schedule: mockScheduleDao
      };
      const models = {
        Date: MockDate
      };
      const dateId = uuid();
      const dateData = { id: dateId };

      const dateInstance = createDateInstance(dateId, dateData);

      // just needs to return something, don't care what
      const findOneMockLocationScheduleStub = stub(mockLocationScheduleDao, 'findOne').returns({});
      const loadMockDateStub = stub(
        MockDate.prototype, 'load'
      )
        .returns(dateInstance);

      const location = new LocationModel({}, access, mockLogger, models, id);
      const loadMockLocationStub = stub(location, 'load').returns(true);

      const dateSchedule = [{
        closing: '23:00',
        isSpecialHours: false,
        opening: '10:00',
        type: 'stuff'
      }];

      const output = await location.addSchedule('2018/30/1', dateSchedule, mockTransaction);
      expect(loadMockDateStub.args[0][0]).to.equal('2018/30/1');
      expect(output).to.equal(null);

      sinon.restore();
    });
  });
});
