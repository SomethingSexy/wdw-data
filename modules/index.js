"use strict";
// import { graphql } from 'graphql';
// import { list  as aList } from './attractions';
// import { list as dList } from './dining';
// import { list as hList } from './hours';
// import schema from './schema/index';
// // TODO: This should move to the services layer
// export const api = query => {
//   return graphql(schema, query);
// };
// // these should have the same api
// // save off external id, but generate our own internal id
// // TODO: WL
// export const attractions = {
//   find: () => {
//     return {
//       info: '',
//       waitTimes: ''
//     };
//   },
//   list: aList
// };
// export const dining = {
//   list: dList,
//   // available reservations?
//   reservations: ''
// };
// export const parks = {
//   get: '',
//   hours: '',
//   list: ''
// };
// // This is really hours by date, it could go in a calendar export
// // or tied to parks, however you might only want to get the calendar
// // in subsequent calls
// export const hours = { list: hList };
// // TODO output hotels
// // TODO output parks, includes hours
// // TODO places = hotels, parks, attractions, dining
// // TODO: output a single api to get the data using graphql
// // have this project store the data locally (except for park hours)
//# sourceMappingURL=index.js.map