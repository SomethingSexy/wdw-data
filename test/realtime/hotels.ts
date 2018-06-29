import { expect } from 'chai';
import 'mocha';
import { list } from '../../src/realtime/hotels';

describe('hotels', () => {
  describe('list', () => {
    it('should fetch a list of hotel options', async () => {
      return list()
        .then(response => console.log(response));
    });
  });
});
