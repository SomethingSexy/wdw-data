"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const winston_1 = require("winston");
const { combine, timestamp, label, printf } = winston_1.format;
const stringFormat = printf(info => {
    return `${info.timestamp} - ${os_1.default.hostname()} [${info.label}] ${info.level}: ${info.message}`;
});
const logFormat = combine(label({ label: 'wdw-data' }), timestamp(), winston_1.format.align(), stringFormat);
const logTransports = [];
logTransports.push(new winston_1.transports.Console({
    format: combine(label({ label: 'wdw-data' }), timestamp(), winston_1.format.align(), winston_1.format.colorize(), stringFormat)
}));
const logger = winston_1.createLogger({
    format: logFormat,
    level: 'error',
    transports: logTransports,
});
/**
 * Logger for internal testing only.
 */
exports.default = logger;
//# sourceMappingURL=log.js.map