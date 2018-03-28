"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const Place_1 = require("./Place");
const attractionType = new graphql_1.GraphQLObjectType({
    description: 'An attraction in WDW.',
    fields: () => ({
        id: {
            description: 'The id of the park',
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
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
    name: 'Attraction'
});
exports.default = attractionType;
//# sourceMappingURL=Attraction.js.map