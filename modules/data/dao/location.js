"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
/**
 *
 */
exports.default = sequelize => {
    const Location = sequelize.define('location', {
        description: sequelize_1.default.TEXT,
        extId: sequelize_1.default.STRING,
        extRefName: sequelize_1.default.STRING,
        fetchSchedule: {
            allowNull: false,
            defaultValue: false,
            type: sequelize_1.default.BOOLEAN
        },
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        name: sequelize_1.default.STRING,
        type: sequelize_1.default.STRING,
        url: sequelize_1.default.STRING,
    }, {
        indexes: [{
                fields: ['extId'],
                unique: true
            },
            { fields: ['name'] }]
    });
    return Location;
};
//# sourceMappingURL=location.js.map