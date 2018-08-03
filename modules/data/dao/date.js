"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const Date = sequelize.define('date', {
        date: sequelize_1.default.DATEONLY,
        holiday: sequelize_1.default.STRING,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        isHoliday: sequelize_1.default.BOOLEAN
    }, {
        indexes: [{
                fields: ['date'],
                unique: true
            }]
    });
    return Date;
};
//# sourceMappingURL=date.js.map