import { expect } from 'chai';
import 'mocha';
import nock from 'nock';
import { list } from '../../src/realtime/shops';

const mockLogger = (type: string, message: string) => {}; // tslint:disable-line

const listSuccess = `<ul><li class="card show shops " data-entityid="54875;entityType=MerchandiseFacility"><div class="cardLink finderCard" role="link"><span tabindex="0" class="accessibleText">Accents</span><div class="cardLinkContainer"><picture class="thumbnail"><source media="(min-width: 768px)" src="https://secure.cdn1.wdpromedia.com/resize/mwImage/1/170/96/75/dam/wdpro-assets/things-to-do/more/shops/dolphin-resort/lamonts/lamonts-00.jpg?1520701290927"><source media="(min-width: 768px) and (-webkit-min-device-pixel-ratio: 2)" src="https://secure.cdn1.wdpromedia.com/resize/mwImage/1/340/192/75/dam/wdpro-assets/things-to-do/more/shops/dolphin-resort/lamonts/lamonts-00.jpg?1520701290927"><img src="https://secure.cdn1.wdpromedia.com/resize/mwImage/1/340/192/75/dam/wdpro-assets/things-to-do/more/shops/dolphin-resort/lamonts/lamonts-00.jpg?1520701290927" alt="The sign at the entrance of the Walt Disney World Swan Hotel" class="thumbnail shops"></picture><div class="itemInfo"><h2 class="cardName">Accents</h2><div class="descriptionLines"><span class="line1 shops facets" aria-label="facets">Apparel &amp; Accessories</span><span class="line1" aria-label="location">Walt Disney World Dolphin Hotel</span></div><div class="metaInfo metaInfoTablet"></div></div></div></div><div class="wishIconContent" data-favorite-id="54875;entityType=MerchandiseFacility"><span class="wishIcon wishlistUnselected wishButton" role="link" tabindex="0" aria-label="Add Accents to your Wish List" title="Add to Wish List" data-card-title="Accents"></span><span class="wishListLoading hidden" data-favorite-id-load="54875;entityType=MerchandiseFacility"><img src="https://secure.cdn1.wdpromedia.com/media/pep/live/media/site/img/style/fb38bab5d5d4bc9609141fb3a2ba9a2f-peploading_30x30.gif" alt="Loading..." data-alt-src="" onerror="PEP.global.handleImageError(this)"></span></div></li><li class="card show shops " data-entityid="53080;entityType=MerchandiseFacility"><div class="cardLink finderCard hasLink" role="link"><span tabindex="0" class="accessibleText">Adrian &amp; Edith's Head to Toe</span><div class="cardLinkContainer"><picture class="thumbnail"><source media="(min-width: 768px)" src="https://secure.cdn1.wdpromedia.com/resize/mwImage/1/170/96/75/dam/wdpro-assets/things-to-do/more/shops/hollywood-studios/adrian-ediths-head-to-toe/adrian-and-ediths-head-to-toe-00.jpg?1521350709837"><source media="(min-width: 768px) and (-webkit-min-device-pixel-ratio: 2)" src="https://secure.cdn1.wdpromedia.com/resize/mwImage/1/340/192/75/dam/wdpro-assets/things-to-do/more/shops/hollywood-studios/adrian-ediths-head-to-toe/adrian-and-ediths-head-to-toe-00.jpg?1521350709837"><img src="https://secure.cdn1.wdpromedia.com/resize/mwImage/1/340/192/75/dam/wdpro-assets/things-to-do/more/shops/hollywood-studios/adrian-ediths-head-to-toe/adrian-and-ediths-head-to-toe-00.jpg?1521350709837" alt="A pair of siblings happily skip down Sunset Boulevard wearing their Mickey and Minnie Mouse t-shirts." class="thumbnail shops"></picture><div class="itemInfo"><h2 class="cardName">Adrian &amp; Edith's Head to Toe</h2><div class="descriptionLines"><span class="line1 shops facets" aria-label="facets">Mickey Ears, Apparel &amp; Accessories</span><span class="line1" aria-label="location">Disney's Hollywood Studios, Hollywood Boulevard</span></div><div class="metaInfo metaInfoTablet"></div></div></div><div class="detailIndicatorContainer" aria-hidden="true"></div><a href="https://disneyworld.disney.go.com/shops/hollywood-studios/adrian-ediths-head-to-toe/" id="53080;entityType=MerchandiseFacility" class="cardLinkOverlay lowOverlay" title="Learn more about Adrian &amp; Edith's Head to Toe"></a></div><div class="wishIconContent" data-favorite-id="53080;entityType=MerchandiseFacility"><span class="wishIcon wishlistUnselected wishButton" role="link" tabindex="0" aria-label="Add Adrian &amp; Edith's Head to Toe to your Wish List" title="Add to Wish List" data-card-title="Adrian &amp; Edith's Head to Toe"></span><span class="wishListLoading hidden" data-favorite-id-load="53080;entityType=MerchandiseFacility"><img src="https://secure.cdn1.wdpromedia.com/media/pep/live/media/site/img/style/fb38bab5d5d4bc9609141fb3a2ba9a2f-peploading_30x30.gif" alt="Loading..." data-alt-src="" onerror="PEP.global.handleImageError(this)"></span></div></li></ul>`; // tslint:disable-line

describe('shops', () => {
  describe('list', () => {
    it('should find a list of shops', async () => {
      nock('https://disneyworld.disney.go.com')
        .get(
          '/shops/',
        )
        .query(true)
        .reply(200, listSuccess);

      return list(mockLogger)
        .then(response =>
          expect(response).to.deep.equal([{
            area: undefined,
            extId: '54875;entityType=MerchandiseFacility',
            extRefName: undefined,
            location: 'Walt Disney World Dolphin Hotel',
            name: 'Accents',
            tags: ['Apparel & Accessories'],
            type: 'merchandisefacility',
            url: undefined
          }, {
            area: 'Hollywood Boulevard',
            extId: '53080;entityType=MerchandiseFacility',
            extRefName: 'adrian-ediths-head-to-toe',
            location: `Disney's Hollywood Studios`,
            name: `Adrian & Edith's Head to Toe`,
            tags: ['Mickey Ears', 'Apparel & Accessories'],
            type: 'merchandisefacility',
            url: 'https://disneyworld.disney.go.com/shops/hollywood-studios/adrian-ediths-head-to-toe/' // tslint:disable-line
          }])
        );
    });
  });
});
