import { expect } from 'chai';
import 'mocha';
import { list } from '../src/dining';

describe('dinning', () => {
  describe('list', () => {
    it('should fetch a list of dinning options', async () => {
      return list()
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });
});
