"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const locationType = new graphql_1.GraphQLObjectType({
    description: 'Location in WDW.',
    fields: () => ({
        areas: {
            description: 'Areas within a location',
            type: new graphql_1.GraphQLList(graphql_1.GraphQLString)
        },
        id: {
            description: 'The id of the park',
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        },
        name: {
            description: 'The name of the place',
            type: graphql_1.GraphQLString
        }
    }),
    name: 'Location'
});
exports.default = locationType;
//# sourceMappingURL=Location.js.map