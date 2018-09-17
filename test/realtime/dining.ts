import { expect } from 'chai';
import 'mocha';
import nock from 'nock';
import { reservations, reservationsByDate } from '../../src/realtime/dining';

const mockLogger = (type: string, message: string) => {}; // tslint:disable-line

const diningSuccess = '<div class="horizontalSeparator diningCtaHSeparator"></div><span class="title">Available Times</span> <span class="diningReservationInfoText available"> Search results around 8:00 AM to 11:50 AM on Thursday, February 14, 2019. </span> <div class="ctaAvailableTimesContainer"> <div class="availableTime"> <a class="pillLink" data-plugins="[&quot;pepActiveStyleSupport&quot;]" href="https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/646dc690-96d9-47a8-8f13-eea1f90117b9&amp;offerOrigin=/dining/grand-floridian-resort-and-spa/1900-park-fare/"><span class="button offerButton blue firstCtaOption pillBase callToAction " tabindex="0" data-serviceDateTime="2019-02-14T09:45:00-05:00" data-offerIds="offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/646dc690-96d9-47a8-8f13-eea1f90117b9" data-bookingLink="https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/646dc690-96d9-47a8-8f13-eea1f90117b9&amp;offerOrigin=/dining/grand-floridian-resort-and-spa/1900-park-fare/" data-bookingType="table-service"> <span class="gradient"> <span class="buttonText">9:45 AM</span> </span></span></a> </div><div class="availableTime"> <a class="pillLink" data-plugins="[&quot;pepActiveStyleSupport&quot;]" href="https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/069a40fa-aba9-4a44-9f8b-9edef8455bab&amp;offerOrigin=/dining/grand-floridian-resort-and-spa/1900-park-fare/"><span class="button offerButton blue pillBase callToAction " tabindex="0" data-serviceDateTime="2019-02-14T10:05:00-05:00" data-offerIds="offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/069a40fa-aba9-4a44-9f8b-9edef8455bab" data-bookingLink="https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/069a40fa-aba9-4a44-9f8b-9edef8455bab&amp;offerOrigin=/dining/grand-floridian-resort-and-spa/1900-park-fare/" data-bookingType="table-service"> <span class="gradient"> <span class="buttonText">10:05 AM</span> </span></span></a> </div></div><span id="diningAvailabilityFlag" data-hasavailability="1"></span>'; // tslint:disable-line
const allDiningSuccess = {
  availability: {
    '18690902;entityType=Dining-Event': {
      availableTimes: [{
        id : '18109977;entityType=restaurant',
        offers: [{
          dateTime: '2018-09-13T19:20:00-04:00',
          time: '19:20',
          url: 'test'
        }]
      }]
    },
    '3809;entityType=Dinner-Show': {
      availableTimes: [{
        unavailableReason: 'NO_AVAILABILITY'
      }]
    },
    '98575;entityType=restaurant': {
      availableTimes: [{
        offers: [{
          dateTime: '2018-09-13T19:20:00-04:00',
          time: '19:20'
        }]
      }]
    }
  }
};

describe('dinning', () => {
  describe('reservationsByDate', () => {
    it('should find a list of reservations', async () => {
      nock('https://authorization.go.com')
        .post('/token')
        .reply(
          200,
          { access_token: '123-456-789', expires_in: '10' }
        );
      nock('https://disneyworld.disney.go.com')
        .get(
          '/api/wdpro/explorer-service/public/finder/dining-availability/80007798;entityType=destination', // tslint:disable-line
        )
        .query(true)
        .reply(200, allDiningSuccess);

      return reservationsByDate(mockLogger, '2018-11-08', '13:00', 2)
        .then(response =>
          expect(response).to.deep.equal([{
            availability: [{
              dateTime: '2018-09-13T19:20:00-04:00',
              time: '19:20'
            }],
            extId: '98575;entityType=restaurant'
          }])
        );
    });
  });

  describe('reservations', () => {
    it('should find a reservation', async () => {
      nock('https://disneyworld.disney.go.com')
        .get('/dining/grand-floridian-resort-and-spa/1900-park-fare/')
        .reply(
          200,
          '<input id="pep_csrf" value="c3934980ffbce07e862962" />',
          { 'set-cookie': ['PHPSESSID=3h2dvdeab9jldhd53fegl92ve0; path=/; secure; HttpOnly'] }
        );

      nock('https://disneyworld.disney.go.com')
        .post(
          '/finder/dining-availability/',
          'id=90001212%3BentityType%3Drestaurant&partySize=2&searchDate=2018-11-08&searchTime=80000714&skipPricing=true&type=dining&pep_csrf=c3934980ffbce07e862962' // tslint:disable-line
        )
        .reply(200, diningSuccess);

      const dining = {
        id: '90001212;entityType=restaurant',
        url: 'https://disneyworld.disney.go.com/dining/grand-floridian-resort-and-spa/1900-park-fare/' // tslint:disable-line
      };

      return reservations(dining, '2018-11-08', 'dinner', 2)
        .then(response =>
          expect(response).to.deep.equal([{
            link:'https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/646dc690-96d9-47a8-8f13-eea1f90117b9&offerOrigin=/dining/grand-floridian-resort-and-spa/1900-park-fare/', // tslint:disable-line
            time: '9:45 AM'
          }, {
            link: 'https://disneyworld.disney.go.com/dining-reservation/setup-order/table-service/?offerId[]=https://disneyworld.disney.go.com/api/wdpro/global-pool-override-A/availability-service/table-service-availability/81f00b7e-1ad4-46e0-98f7-41db4ee326a7/offers/069a40fa-aba9-4a44-9f8b-9edef8455bab&offerOrigin=/dining/grand-floridian-resort-and-spa/1900-park-fare/', // tslint:disable-line
            time: '10:05 AM'
          }])
        );
    });
  });
});
