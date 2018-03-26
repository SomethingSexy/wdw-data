"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const place_1 = require("../model/place");
const Attraction_1 = require("./Attraction");
const Dining_1 = require("./Dining");
const Place_1 = require("./Place");
const ThemePark_1 = require("./ThemePark");
const queryType = new graphql_1.GraphQLObjectType({
    fields: () => ({
        place: {
            args: {
                id: {
                    description: 'id of the place',
                    type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
                },
            },
            resolve: (_, { id }) => {
                return place_1.default.get(id);
            },
            type: Place_1.default,
        },
        places: {
            resolve: _ => {
                return place_1.default.getAll();
            },
            type: new graphql_1.GraphQLList(Place_1.default),
        }
    }),
    name: 'Query'
});
exports.default = new graphql_1.GraphQLSchema({
    query: queryType,
    types: [Attraction_1.default, Dining_1.default, ThemePark_1.default],
});
//# sourceMappingURL=index.js.map