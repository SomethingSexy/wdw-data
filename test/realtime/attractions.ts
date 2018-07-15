import { expect } from 'chai';
import 'mocha';
import { get, list } from '../../src/realtime/attractions';

describe('attractions', () => {
  describe('list', () => {
    it('should fetch a list of attractions options', async () => {
      return list()
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });
  describe('get', () => {
    it('should detailed information', async () => {
      return get({ extId: '18904172;entityType=Attraction' })
        .then(response => {
          expect(response.extId).to.equal('18904172;entityType=Attraction');
        });
    });
  });
});
