import { expect } from 'chai';
import 'mocha';
import { getAccessToken } from '../../../src/realtime/api/request';

describe('api - request', () => {
  describe('getAccessToken', () => {
    it('should fetch an access token', async () => {
      return getAccessToken()
        .then((response: string) => expect(response.length > 0).to.equal(true));
    });
  });
});
