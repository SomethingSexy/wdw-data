"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const Attraction_1 = __importDefault(require("./Attraction"));
const Dining_1 = __importDefault(require("./Dining"));
const ThemePark_1 = __importDefault(require("./ThemePark"));
// const PlaceType = new GraphQLUnionType({
//   description: 'A location at WDW',
//   name: 'Place',
//   resolveType: place => {
//     if (place.type === 'themePark') {
//       return ThemeParkType;
//     }
//     return ThemeParkType;
//   },
//   types: [ThemeParkType],
// });
const PlaceType = new graphql_1.GraphQLInterfaceType({
    description: 'A character in the Star Wars Trilogy',
    fields: () => ({
        description: {
            description: 'The description of the place.',
            type: graphql_1.GraphQLString
        },
        id: {
            description: 'The id of the place.',
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        },
        location: {
            description: 'The id of the location',
            type: graphql_1.GraphQLString
        },
        name: {
            description: 'The name of the place',
            type: graphql_1.GraphQLString
        },
        type: {
            description: 'The type of the place',
            type: graphql_1.GraphQLString
        },
    }),
    name: 'Place',
    resolveType(place) {
        if (place.type === 'themePark'
            || place.type === 'waterPark'
            || place.type === 'venue') {
            return ThemePark_1.default;
        }
        // TODO: normalize these
        if (place.type === 'restaurant'
            || place.type === 'Dining'
            || place.type === 'Dinner') {
            return Dining_1.default;
        }
        if (place.type === 'attraction') {
            return Attraction_1.default;
        }
        throw new Error(`Missing type for ${place.type}`);
    },
});
exports.default = PlaceType;
//# sourceMappingURL=Place.js.map