import Sequelize from 'sequelize';
import models from './data/index';
import { IConnection, ILogType } from './types';

/**
 * Creates a database connection and returns models for accessing data.
 * @param connection
 */
export const createModels = async (connection: IConnection, logger?: ILogType) => {
  const sequelize = new Sequelize({
    ...connection,
    dialect: 'postgres'
  });

  return models(sequelize, logger);
};

// TODO: Export realtime stuff for hooking up to jobs
