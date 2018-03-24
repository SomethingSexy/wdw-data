import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import PlaceType from './Place';

const themeParkType = new GraphQLObjectType({
  description: 'A themepark in WDW.',
  fields: () => ({
    id: {
      description: 'The id of the park',
      type: new GraphQLNonNull(GraphQLString)
    },
    type: {
      description: 'The type of the place.',
      type: GraphQLString
    },
  }),
  interfaces: () => [PlaceType],
  name: 'ThemePark'
});

export default themeParkType;
