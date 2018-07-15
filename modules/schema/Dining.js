"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const Place_1 = __importDefault(require("./Place"));
const diningType = new graphql_1.GraphQLObjectType({
    description: 'Dining in WDW.',
    fields: () => ({
        cost: {
            description: 'The average cost of the dining',
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        },
        cuisine: {
            description: 'The type of cuisine',
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        },
        description: {
            description: 'The description of the dining experience',
            type: graphql_1.GraphQLString
        },
        id: {
            description: 'The id of the dining',
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
        }
    }),
    interfaces: () => [Place_1.default],
    name: 'Dining'
});
exports.default = diningType;
//# sourceMappingURL=Dining.js.map