"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = __importDefault(require("cheerio"));
const moment_1 = __importDefault(require("moment"));
const screen_1 = require("./api/screen");
const calendarPath = 'https://disneyworld.disney.go.com/calendars/month/';
const FORMAT = 'YYYY-MM-DD';
// TODO: Pull from parks first
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
const thisMonth = moment_1.default().month();
const getParkInfo = ($park) => {
    const parkInfo = {
        hours: $park.find('div.parkHours p').text(),
        name: $park.find('span.parkName').text(),
    };
    if ($park.has('div.magicHours').length
        && $park.has('div.magicHours').children().length) {
        parkInfo.extraMagic = cheerio_1.default($park.find('div.magicHours').children().get(1)).text();
    }
    return parkInfo;
};
const getDayInfo = (rawDay) => {
    const $day = cheerio_1.default(rawDay);
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
exports.list = async (months = 1, date) => {
    // use passed in date or set to month to handle current date
    let mDate;
    if (date) {
        mDate = moment_1.default(date, FORMAT);
        if (!mDate.isValid()) {
            throw new Error('If supplying date, it must be in YYYY-MM-DD format.');
        }
    }
    else {
        mDate = moment_1.default();
    }
    // process all months
    const dates = [mDate.format(FORMAT)]; // init
    for (let i = 1; i < months; i = i + 1) {
        dates.push(mDate.add(1, 'M').date(1).format(FORMAT));
    }
    const toFetch = dates.map(dateToFetch => {
        if (moment_1.default(dateToFetch).month() === thisMonth) {
            return screen_1.grab(calendarPath);
        }
        return screen_1.grab(`${calendarPath}/${dateToFetch}`);
    });
    // array of raw html
    const responses = await Promise.all(toFetch);
    // response per month
    const hoursByDate = responses
        .map((screen, index) => {
        // find all entries
        const availableDates = screen.html()
            .find('#monthlyCalendarTable tr.weekRow > td')
            .toArray()
            .map(getDayInfo)
            .filter((parkDate) => !!parkDate)
            .map(day => {
            const parkDate = moment_1.default(dates[index])
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
};
//# sourceMappingURL=hours.js.map