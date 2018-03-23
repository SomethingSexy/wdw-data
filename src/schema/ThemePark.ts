import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import PlaceType from './Place';

const themeParkType = new GraphQLObjectType({
  description: 'A themepark in WDW.',
  fields: () => ({
    id: {
      description: 'The id of the human.',
      type: new GraphQLNonNull(GraphQLString)
    },
    type: {
      type: GraphQLString,
      description: 'The name of the character.',
    },
  }),
  name: 'ThemePark',
  interfaces: () => [PlaceType]
});

export default themeParkType;
