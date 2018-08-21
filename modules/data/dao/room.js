"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const Room = sequelize.define('room', {
        bedsDescription: sequelize_1.default.TEXT,
        description: sequelize_1.default.TEXT,
        extId: sequelize_1.default.STRING,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        },
        name: sequelize_1.default.STRING,
        occupancy: sequelize_1.default.INTEGER,
        occupancyDescription: sequelize_1.default.TEXT,
        pricingUrl: sequelize_1.default.STRING,
        view: sequelize_1.default.STRING // todo this should be another table
    });
    return Room;
};
//# sourceMappingURL=room.js.map