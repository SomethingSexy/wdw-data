import { expect } from 'chai';
import 'mocha';
import moment from 'moment';
import { hours, waitTimes } from '../../src/realtime/parks';

describe('parks', () => {
  describe('waitTime', () => {
    it('should fetch wait times', async () => {
      return waitTimes({ extId: '80007944;entityType=theme-park' })
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });

  describe('hours', () => {
    it('should fetch hours for a given park', async () => {
      const opening = moment().format('YYYY-MM-DD');
      return hours({ extId: '80007944;entityType=theme-park', type: 'theme-park' }, opening)
        .then(response => {
          expect(response).to.be.a('object');
          expect(response[opening]).to.be.a('array');
          expect(response[opening].length).to.be.above(0);
        });
    });
  });
});
