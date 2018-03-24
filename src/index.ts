import { list  as aList } from './attractions';
import { list as dList } from './dining';
import { list as hList } from './hours';

// these should have the same api
// save off external id, but generate our own internal id
export const attractions = { list: aList };
export const dining = { list: dList };
// This is really hours by date, it could go in a calendar export
// or tied to parks, however you might only want to get the calendar
// in subsequent calls
export const hours = { list: hList };
// TODO output hotels
// TODO output parks

// TODO places = hotels, parks, attractions, dining
// TODO: output a single api to get the data using graphql
// have this project store the data locally (except for park hours)
