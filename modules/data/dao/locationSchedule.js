"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const LocationSchedules = sequelize.define('location_schedule', {
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        }
    });
    return LocationSchedules;
};
//# sourceMappingURL=locationSchedule.js.map