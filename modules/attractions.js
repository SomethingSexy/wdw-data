var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as cheerio from 'cheerio';
import 'fetch-everywhere';
export const list = () => __awaiter(this, void 0, void 0, function* () {
    const response = yield fetch('https://disneyworld.disney.go.com/attractions/', {
        headers: {
            Accept: '*/*',
            'Accept-Language': 'en-US,en;q=0.8',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Host: 'disneyworld.disney.go.com',
            Origin: 'https://disneyworld.disney.go.com',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.125 Safari/537.36' // tslint:disable-line
        },
        method: 'get'
    });
    const text = yield response.text();
    const $ = cheerio(text);
    const attractions = $.find('li.card').map(({}, card) => {
        const $card = cheerio(card);
        const id = $card.attr('data-entityid');
        const type = new RegExp(/\d+;entityType=(\w+)/, 'g').exec(id);
        return {
            id,
            location: $card.find('span[aria-label=location]').text(),
            name: $card.find('.cardName').text(),
            type: type ? type[1] : ''
        };
    }).get();
    // TODO: Get character experiences as well
    return attractions;
});
//# sourceMappingURL=attractions.js.map