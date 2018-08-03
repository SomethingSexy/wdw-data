"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const Schedule = sequelize.define('schedule', {
        closing: sequelize_1.default.STRING,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        isSpecialHours: sequelize_1.default.BOOLEAN,
        opening: sequelize_1.default.STRING,
        type: sequelize_1.default.STRING
    });
    return Schedule;
};
//# sourceMappingURL=schedule.js.map