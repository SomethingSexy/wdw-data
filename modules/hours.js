var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as cheerio from 'cheerio';
import * as moment from 'moment';
import api from './api';
const FORMAT = 'YYYY-MM-DD';
const parks = [
    'magic-kingdom',
    'epcot',
    'hollywood-studios',
    'animal-kingdom',
    'typhoon-lagoon',
    'blizzard-beach',
    'disney-springs',
    'wide-world-of-sports'
];
const thisMonth = moment().month();
const getParkInfo = ($park) => {
    const parkInfo = {
        hours: $park.find('div.parkHours p').text(),
        name: $park.find('span.parkName').text(),
    };
    if ($park.has('div.magicHours').length
        && $park.has('div.magicHours').children().length) {
        parkInfo.extraMagic = cheerio($park.find('div.magicHours').children().get(1)).text();
    }
    return parkInfo;
};
const getDayInfo = (rawDay) => {
    const $day = cheerio(rawDay);
    if (!$day.has('div.noData').length) {
        const day = $day.find('.dayOfMonth').text();
        // this will contain all of the parks
        const $parks = $day.find('.parkContentContainer');
        const parkHours = parks.map(park => {
            const $park = $parks.find(`div.${park}`);
            return getParkInfo($park);
        });
        return {
            date: day,
            parks: parkHours
        };
    }
    return null;
};
/**
 *
 * @param months - how many months we should fetch
 * @param date - if we should we start at a specific date, defaults to current date
 */
export const list = (months = 1, date) => __awaiter(this, void 0, void 0, function* () {
    // use passed in date or set to month to handle current date
    let mDate;
    if (date) {
        mDate = moment(date, FORMAT);
        if (!mDate.isValid()) {
            throw new Error('If supplying date, it must be in YYYY-MM-DD format.');
        }
    }
    else {
        mDate = moment();
    }
    // process all months
    const dates = [mDate.format(FORMAT)]; // init
    for (let i = 1; i < months; i = i + 1) {
        dates.push(mDate.add(1, 'M').date(1).format(FORMAT));
    }
    const toFetch = dates.map(dateToFetch => {
        if (moment(dateToFetch).month() === thisMonth) {
            return api('calendars/month');
        }
        return api(`calendars/month/${dateToFetch}`);
    });
    // array of raw html
    const responses = yield Promise.all(toFetch);
    // response per month
    const hoursByDate = responses
        .map((rawMonth, index) => {
        // find all entries
        const availableDates = cheerio(rawMonth)
            .find('#monthlyCalendarTable tr.weekRow > td')
            .toArray()
            .map(getDayInfo)
            .filter((parkDate) => !!parkDate)
            .map(day => {
            const parkDate = moment(dates[index])
                .date(Number.parseInt(day.date, 10))
                .format(FORMAT);
            return Object.assign({}, day, { date: parkDate });
        });
        return availableDates;
    })
        .reduce((allDates, month) => {
        return allDates.concat(month);
    }, []);
    return hoursByDate;
});
//# sourceMappingURL=hours.js.map