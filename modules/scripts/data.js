"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const uuid_1 = require("uuid");
const parks_1 = require("../src/data/parks");
const index_1 = require("../src/index");
// Fetch all data, group together and save
const runDining = () => {
    return index_1.dining.list().then((results) => {
        return results;
        // writeJsonSync('./src/data/dining.json', results);
    });
};
const runAttractions = () => {
    return index_1.attractions.list().then((results) => {
        return results;
        // writeJsonSync('./src/data/attractions.json', results);
    });
};
// const runHours = () => {
//   return hours.list().then((results: any) => {
//     writeJsonSync('./src/data/hours.json', results);
//   });
// };
Promise.all([runDining(), runAttractions()]).then(([fetchedDining = [], fetchedAttractions = []]) => {
    // start with parks and then add
    const places = parks_1.default
        .concat(fetchedDining
        .map((place) => {
        return Object.assign({}, place, { extId: place.id, id: uuid_1.v4() });
    }))
        .concat(fetchedAttractions
        .map((place) => {
        return Object.assign({}, place, { extId: place.id, id: uuid_1.v4() });
    }));
    fs_extra_1.writeJsonSync('./src/data/places.json', places);
    process.exit();
});
//# sourceMappingURL=data.js.map