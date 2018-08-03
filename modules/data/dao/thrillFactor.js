"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const ThrillFactor = sequelize.define('thrill_factor', {
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        name: {
            type: sequelize_1.default.STRING,
            unique: true
        }
    });
    return ThrillFactor;
};
//# sourceMappingURL=thrillFactor.js.map