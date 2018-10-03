import { expect } from 'chai';
import 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import { spy, stub } from 'sinon';
import uuid from 'uuid/v4'; // tslint:disable-line
import LocationModel, { GetTypes } from '../../../src/data/model/Location';
import { Success } from '../../../src/data/utils';
import { ILocation } from '../../../src/types';
import {
  createDateInstance,
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

      findOneMockLocationStub.restore();
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

      findOneMockLocationStub.restore();
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

      findOneMockLocationStub.restore();
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
      const upsertStub = stub().returns(createLocationInstance(id, data));
      const getMockLocationStub = stub(mockLocationDao, 'get').returns();
      const Location = proxyquire(
        '../../../src/data/model/Location',
        { '../utils': { upsert: upsertStub } }
      );

      const access = {
        Activity: mockActivityDao,
        Address: mockAddressDao,
        Area: mockAreaDao,
        Location: mockLocationDao
      };

      const location = new Location.default({}, access, mockLogger, '123');

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
        type: 'theme-park',
        url: 'http://foo.com'
      };

      const output =  await location.upsert(item);
      expect(output).to.equal(id);

      getMockLocationStub.restore();

    });
  });

  describe('getLocationSchedule', () => {

  });

  describe('bulkAddSchedules', () => {
    it('should add multiple schedules', async () => {
      const id = uuid();
      const models = {
        Date: null
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

      const location = new LocationModel(mockSequelize, {}, mockLogger, models, id);
      const loadMockLocationStub = stub(location, 'load').returns(true);
      const addScheduleMockLocationStub = stub(location, 'addSchedule');

      const output = await location.bulkAddSchedules(schedules);
      expect(output).to.deep.equal({ [Success]: true });
      expect(addScheduleMockLocationStub.callCount).to.equal(2);
      expect(addScheduleMockLocationStub.args[0][0]).to.equal('2018/30/1');
      expect(addScheduleMockLocationStub.args[0][1]).to.deep.equal(schedules['2018/30/1']);
      expect(addScheduleMockLocationStub.args[1][0]).to.equal('2018/30/2');
      expect(addScheduleMockLocationStub.args[1][1]).to.deep.equal(schedules['2018/30/2']);

      loadMockLocationStub.restore();
      addScheduleMockLocationStub.restore();
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

      loadMockLocationStub.restore();
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
      const loadMockDateStub = stub(MockDate.prototype, 'load').returns(dateInstance);

      const createMockScheduleStub = stub(mockScheduleDao, 'create')
        .returns(createScheduleInstance('', {})) ;

      const location = new LocationModel({}, access, mockLogger, models, id);
      const loadMockLocationStub = stub(location, 'load').returns(true);

      const schedules = [{
        closing: '23:00',
        isSpecialHours: false,
        opening: '10:00',
        type: 'stuff'
      }];

      const output = await location.addSchedule('2018/30/1', schedules, mockTransaction);

      expect(loadMockDateStub.args[0][0]).to.equal('2018/30/1');
      expect(createMockScheduleStub.callCount).to.equal(1);
      expect(createMockScheduleStub.args[0][0]).to.deep.equal(schedules[0]);
      expect(addScheduleMockDateStub.callCount).to.equal(1);
      expect(addScheduleMockDateStub.args[0][1]).to.deep.equal({
        through: { locationId: id },
        transaction: mockTransaction
      });

      loadMockDateStub.restore();
      createMockScheduleStub.restore();
      addScheduleMockDateStub.restore();
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

      const schedules = [{
        closing: '23:00',
        isSpecialHours: false,
        opening: '10:00',
        type: 'stuff'
      }];

      const output = await location.addSchedule('2018/30/1', schedules, mockTransaction);
      expect(loadMockDateStub.args[0][0]).to.equal('2018/30/1');
      expect(output).to.equal(null);

      findOneMockLocationScheduleStub.restore();
      loadMockDateStub.restore();
    });
  });
});
