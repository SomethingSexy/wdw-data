"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const Reservation = sequelize.define('reservation', {
        // dateId, - date of reservation
        // diningId,
        // dateChecked - probably just string of the when we checked it last
        // time
        // open?
        // daysOut - reservation date - minus current date
        // startDate - defaults to current date
        // endDate - defaults to null
        dateChecked: sequelize_1.default.DATE,
        daysOut: sequelize_1.default.INTEGER,
        endDate: sequelize_1.default.DATE,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        open: sequelize_1.default.BOOLEAN,
        startDate: sequelize_1.default.DATE,
        time: sequelize_1.default.STRING,
    }, {
        indexes: [{
                fields: ['endDate', 'startDate'],
            }]
    });
    return Reservation;
};
//# sourceMappingURL=reservation.js.map