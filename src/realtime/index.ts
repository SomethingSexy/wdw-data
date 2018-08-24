import { ILogger } from '../types';
import { get as attractionGet, list as attractionList } from './attractions';
import { get as diningGet, list as diningList, reservations } from './dining';
import { list as entertainmentList, schedule } from './entertainment';
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
    schedule,
    list: (options?: any) => entertainmentList(logger, options) // tslint:disable-line
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
    waitTimes,
    hours: parkHours, // tslint:disable-line
    list: () => parkList(logger)
  };
};