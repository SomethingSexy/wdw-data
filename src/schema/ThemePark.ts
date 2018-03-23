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
      description: 'The name of the character.',
      type: GraphQLString
    },
  }),
  interfaces: () => [PlaceType],
  name: 'ThemePark'
});

export default themeParkType;
