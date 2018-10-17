"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const invariant_1 = __importDefault(require("invariant"));
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
class DateModel {
    constructor(_, access, logger, date) {
        this.instance = null;
        invariant_1.default(date, 'Date is required to create a date model.');
        // this.sequelize = sequelize;
        this.dao = access;
        this.logger = logger;
        this.date = date;
    }
    get data() {
        // if no instance, throw an error
        invariant_1.default(this.instance, 'An instance is required to retrieve data, call load first.');
        return this.instance.get({ plain: true });
    }
    /**
     * Loads a date instance, in this case it will create a new date if
     * this one cannot be found.
     *
     * @param transaction
     */
    async load(transaction) {
        const { Date } = this.dao;
        const mDate = moment_1.default(this.date, 'YYYY-MM-DD');
        const localDate = mDate.format('YYYY-MM-DD');
        this.logger('debug', `${this.date} ${localDate}`);
        const instance = await Date
            .findOne({ where: { date: localDate } }, { transaction })
            .then(d => {
            if (!d) {
                this.logger('debug', `${localDate} does not exist, creating.`);
                const holiday = mDate.isHoliday();
                return Date.create({
                    date: localDate,
                    dayOfWeek: mDate.format('dddd'),
                    holiday: holiday || null,
                    isHoliday: !!holiday
                }, { transaction });
            }
            return Promise.resolve(d);
        });
        this.instance = instance;
        return true;
    }
}
exports.default = DateModel;
//# sourceMappingURL=Date.js.map