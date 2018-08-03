"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
require("moment-holiday");
exports.default = (_, access) => {
    return {
        async get(scheduleDate, transaction) {
            const { Date } = access;
            const localDate = moment_1.default(scheduleDate).format('YYYY-MM-DD');
            return Date
                .findOne({ where: { date: localDate } }, { transaction })
                .then(d => {
                if (!d) {
                    const mDate = moment_1.default(scheduleDate);
                    const holiday = mDate.isHoliday();
                    return Date.create({
                        date: scheduleDate,
                        holiday: holiday || null,
                        isHoliday: !!holiday
                    }, { transaction });
                }
                return Promise.resolve(d);
            });
        }
    };
};
//# sourceMappingURL=date.js.map