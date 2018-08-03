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
    const LocationArea = sequelize.define('locationArea', {
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
    }, {
        indexes: [{
                fields: ['extId'],
                unique: true
            }]
    });
    return LocationArea;
};
//# sourceMappingURL=locationArea.js.map