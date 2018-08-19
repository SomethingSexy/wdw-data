import { ILogger } from '../types';
import { get as attractionGet, list as attractionList } from './attractions';
import { get as diningGet, list as diningList, reservations } from './dining';
import { list as entertainmentList } from './entertainment';
import { list as hotelList } from './hotels';
import { list as parkList, parkHours, waitTimes } from './parks';

export const attractions = (logger: ILogger) => {
  return {
    get: attractionGet,
    list: (options?: any) => attractionList(logger, options),
  };
};

export const entertainment = (logger: ILogger) => {
  return {
    list: (options?: any) => entertainmentList(logger, options),
  };
};

export const dining = (logger: ILogger) => {
  return {
    reservations,
    get: diningGet, // tslint:disable-line
    list: (options?: any) => diningList(logger, options),
  };
};

export const hotels = (logger: ILogger) => {
  return {
    list: () => hotelList(logger),
  };
};

export const parks = (logger: ILogger) => {
  return {
    parkHours,
    waitTimes,
    list: () => parkList(logger) // tslint:disable-line
  };
};
