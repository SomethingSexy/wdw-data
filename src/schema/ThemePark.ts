import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import PlaceType from './Place';

const themeParkType = new GraphQLObjectType({
  description: 'A themepark in WDW.',
  fields: () => ({
    description: {
      description: 'The description of the themepark',
      type: GraphQLString
    },
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
  name: 'ThemePark'
});

export default themeParkType;
