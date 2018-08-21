"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = __importDefault(require("sequelize"));
exports.default = sequelize => {
    const RoomConfiguration = sequelize.define('room_configuration', {
        count: sequelize_1.default.INTEGER,
        description: sequelize_1.default.TEXT,
        id: {
            defaultValue: sequelize_1.default.UUIDV4,
            primaryKey: true,
            type: sequelize_1.default.UUID,
        }
    });
    return RoomConfiguration;
};
//# sourceMappingURL=roomConfiguration.js.map