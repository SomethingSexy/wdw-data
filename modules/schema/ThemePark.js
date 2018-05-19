"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const Place_1 = require("./Place");
const themeParkType = new graphql_1.GraphQLObjectType({
    description: 'A themepark in WDW.',
    fields: () => ({
        description: {
            description: 'The description of the themepark',
            type: graphql_1.GraphQLString
        },
        id: {
            description: 'The id of the park',
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
            description: 'The type of the place.',
            type: graphql_1.GraphQLString
        },
    }),
    interfaces: () => [Place_1.default],
    name: 'ThemePark'
});
exports.default = themeParkType;
//# sourceMappingURL=ThemePark.js.map