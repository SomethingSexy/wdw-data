import os from 'os';
import { createLogger, format, transports } from 'winston';

const { combine, timestamp, label, printf } = format;

const stringFormat = printf(info => {
  return `${info.timestamp} - ${os.hostname()} [${info.label}] ${info.level}: ${info.message}`;
});

const logFormat = combine(
  label({ label: 'wdw-data' }),
  timestamp(),
  format.align(),
  stringFormat,
);

const logTransports: any = [];

logTransports.push(new transports.Console({
  format: combine(
    label({ label: 'wdw-data' }),
    timestamp(),
    format.align(),
    format.colorize(),
    stringFormat,
  )
}));

const logger = createLogger({
  format: logFormat,
  level: 'debug',
  transports: logTransports,
});

/**
 * Logger for internal testing only.
 */
export default logger;
