import { expect } from 'chai';
import 'mocha';
import { list } from '../../src/realtime/attractions';

describe('attractions', () => {
  describe('list', () => {
    it('should fetch a list of attractions options', async () => {
      return list()
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });
});
