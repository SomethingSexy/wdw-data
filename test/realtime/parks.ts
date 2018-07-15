import { expect } from 'chai';
import 'mocha';
import { hours, waitTimes } from '../../src/realtime/parks';

describe('parks', () => {
  describe('waitTime', () => {
    it('should fetch wait times', async () => {
      return waitTimes({ extId: '80007944;entityType=theme-park' })
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });

  describe('hours', () => {
    it.only('should fetch hours for a given park', async () => {
      return hours({ extId: '80007944;entityType=theme-park' }, '2018-07-14', '2018-07-15')
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });
});
