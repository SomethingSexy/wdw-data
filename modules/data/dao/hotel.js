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
    const Hotel = sequelize.define('hotel', {
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        tier: sequelize_1.default.STRING
    });
    return Hotel;
};
//# sourceMappingURL=hotel.js.map