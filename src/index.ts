import Sequelize from 'sequelize';
import models from './data/index';
import { attractions, dining, entertainment, hotels, parks } from './realtime/index';
import { IConnection, ILogger, ILogType } from './types';

const createLogger = (logger?: ILogType): ILogger =>
  (type: string, message: string) => {
    if (logger) {
      logger.log(type, message);
    }
  };

/**
 * Creates a database connection and returns models for accessing data.
 * @param connection
 */
export const createModels = async (connection: IConnection, logger?: ILogType) => {
  const sequelize = new Sequelize({
    ...connection,
    dialect: 'postgres'
  });

  return models(sequelize, createLogger(logger));
};

// TODO: Export realtime stuff for hooking up to jobs
export const realtime = (logger?: ILogType) => {
  const internalLogger = createLogger(logger);
  return {
    attractions: attractions(internalLogger),
    dining: dining(internalLogger),
    entertainment: entertainment(internalLogger),
    hotels: hotels(internalLogger),
    parks: parks(internalLogger)
  };
};
