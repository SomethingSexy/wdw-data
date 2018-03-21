import { list  as aList } from './attractions';
import { list as dList } from './dinning';
import { list as hList } from './hours';

export const attractions = { list: aList };
export const dining = { list: dList };
// This is really hours by date, it could go in a calendar export
// or tied to parks, however you might only want to get the calendar
// in subsequent calls
export const hours = { list: hList };
// TODO Add park information here
