import { expect } from 'chai';
import 'mocha';
import { list, reservations } from '../../src/realtime/dining';

describe('dinning', () => {
  describe('list', () => {
    it('should fetch a list of dinning options', async () => {
      return list()
        .then(response => expect(response.length > 0).to.equal(true));
    });
  });

  describe('reservations', () => {
    it.only('should fetch a reservation', async () => {
      const dining = {
        id: '90001212;entityType=restaurant',
        url: 'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/1900-park-fare/'
      };

      return reservations(dining, '2018-07-04', 'dinner', 2);
        // .then(response => {});
    });
  });
});
