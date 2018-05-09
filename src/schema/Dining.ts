import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import PlaceType from './Place';

const diningType = new GraphQLObjectType({
  description: 'Dining in WDW.',
  fields: () => ({
    cost: {
      description: 'The average cost of the dining',
      type: new GraphQLNonNull(GraphQLString)
    },
    cuisine: {
      description: 'The type of cuisine',
      type: new GraphQLNonNull(GraphQLString)
    },
    id: {
      description: 'The id of the dining',
      type: new GraphQLNonNull(GraphQLString)
    },
    location: {
      description: 'The id of the location',
      type: GraphQLString
    },
    name: {
      description: 'The name of the place',
      type: GraphQLString
    },
    type: {
      description: 'The type of the place',
      type: GraphQLString
    },
    typeDescription: {
      description: 'The description of the dining experience',
      type: GraphQLString
    }
  }),
  interfaces: () => [PlaceType],
  name: 'Dining'
});

export default diningType;
