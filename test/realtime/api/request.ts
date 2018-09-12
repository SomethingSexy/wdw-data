import { expect } from 'chai';
import 'mocha';
import nock from 'nock';
import { getAccessToken, getWebSession } from '../../../src/realtime/api/request';

describe('api - request', () => {
  describe('getAccessToken', () => {
    it('should fetch an access token', async () => {
      return getAccessToken()
        .then((response: string) => expect(response.length > 0).to.equal(true));
    });
  });

  describe('getWebSession', () => {
    it('should fetch the tokens for making web requests', async () => {
      nock('https://disneyworld.disney.go.com')
        .get('/dining/grand-floridian-resort-and-spa/1900-park-fare/')
        .reply(
          200,
          '<input id="pep_csrf" value="c3934980ffbce07e862962" />',
          { 'set-cookie': ['PHPSESSID=3h2dvdeab9jldhd53fegl92ve0; path=/; secure; HttpOnly'] }
        );

      return getWebSession(
        'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/1900-park-fare/'
      )
        .then((response: string) =>
          expect(response).to.deep.equal({
            cookie: '3h2dvdeab9jldhd53fegl92ve0',
            csrfToken: 'c3934980ffbce07e862962'
          })
        );
    });
  });
});
