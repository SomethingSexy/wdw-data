import { expect } from 'chai';
import 'mocha';
import { list } from '../../src/realtime/hours';

describe('hours', () => {
  describe('list', () => {
    it('should fetch latest park hours', async () => {
      return list()
        .then(response => {
          expect(response.length > 0).to.equal(true);
        });
    });

    it('should fetch multiple months', async () => {
      return list(2)
        .then(response => {
          expect(response.length > 0).to.equal(true);
        });
    });
  });
});
