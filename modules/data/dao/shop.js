"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const Shop = sequelize.define('shop', {
        admissionRequired: {
            allowNull: false,
            defaultValue: false,
            type: sequelize_1.default.BOOLEAN
        },
        description: sequelize_1.default.TEXT,
        extId: sequelize_1.default.STRING,
        extRefName: sequelize_1.default.STRING,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        name: sequelize_1.default.STRING,
        type: sequelize_1.default.STRING,
        url: sequelize_1.default.STRING,
        wheelchairAccessible: {
            allowNull: false,
            defaultValue: true,
            type: sequelize_1.default.BOOLEAN
        }
    }, {
        indexes: [{
                fields: ['extId'],
                unique: true
            }]
    });
    return Shop;
};
//# sourceMappingURL=shop.js.map