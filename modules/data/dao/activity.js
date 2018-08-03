"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
/**
 * TODO:
 *  - add address
 */
exports.default = sequelize => {
    const Activity = sequelize.define('activity', {
        admissionRequired: sequelize_1.default.BOOLEAN,
        allowServiceAnimals: sequelize_1.default.BOOLEAN,
        description: sequelize_1.default.TEXT,
        extId: sequelize_1.default.STRING,
        extRefName: sequelize_1.default.STRING,
        fastPass: sequelize_1.default.BOOLEAN,
        fastPassPlus: sequelize_1.default.BOOLEAN,
        fetchSchedule: {
            allowNull: false,
            defaultValue: false,
            type: sequelize_1.default.BOOLEAN
        },
        height: sequelize_1.default.STRING,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        latitude: sequelize_1.default.REAL,
        longitude: sequelize_1.default.REAL,
        name: sequelize_1.default.STRING,
        riderSwapAvailable: sequelize_1.default.BOOLEAN,
        type: sequelize_1.default.STRING,
        url: sequelize_1.default.STRING,
        wheelchairTransfer: sequelize_1.default.BOOLEAN
    }, {
        indexes: [{
                fields: ['extId'],
                unique: true
            }]
    });
    return Activity;
};
//# sourceMappingURL=activity.js.map