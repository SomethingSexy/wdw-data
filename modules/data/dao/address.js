"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const Address = sequelize.define('address', {
        city: sequelize_1.default.STRING,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        number: sequelize_1.default.STRING,
        plus4: {
            type: sequelize_1.default.TEXT,
            validate: {
                len: [4, 4]
            }
        },
        prefix: sequelize_1.default.STRING,
        state: sequelize_1.default.STRING,
        street: sequelize_1.default.STRING,
        type: sequelize_1.default.STRING,
        zip: {
            type: sequelize_1.default.TEXT,
            validate: {
                len: [5, 5]
            }
        }
    });
    return Address;
};
//# sourceMappingURL=address.js.map