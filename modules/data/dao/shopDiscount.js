"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const ShopDiscount = sequelize.define('shop_discount', {
        description: sequelize_1.default.TEXT,
        discount: sequelize_1.default.TEXT,
        fromDate: sequelize_1.default.DATEONLY,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        thruDate: sequelize_1.default.DATEONLY,
        type: sequelize_1.default.TEXT
    });
    return ShopDiscount;
};
//# sourceMappingURL=shopDiscount.js.map