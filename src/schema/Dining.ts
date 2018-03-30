import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import PlaceType from './Place';

const diningType = new GraphQLObjectType({
  description: 'Dining in WDW.',
  fields: () => ({
    id: {
      description: 'The id of the park',
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
      description: 'The type of the place.',
      type: GraphQLString
    },
  }),
  interfaces: () => [PlaceType],
  name: 'Dining'
});

export default diningType;
