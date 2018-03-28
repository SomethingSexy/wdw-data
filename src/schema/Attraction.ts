import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import PlaceType from './Place';

const attractionType = new GraphQLObjectType({
  description: 'An attraction in WDW.',
  fields: () => ({
    id: {
      description: 'The id of the park',
      type: new GraphQLNonNull(GraphQLString)
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
  name: 'Attraction'
});

export default attractionType;
