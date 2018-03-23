import {
  graphql,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';
import PlaceType from './Place';
import ThemeParkType from './ThemePark';

const queryType = new GraphQLObjectType({
  fields: () => ({
    place: {
      args: {
        id: {
          description: 'id of the place',
          type: new GraphQLNonNull(GraphQLString),
        },
      },
      resolve: (root, { id }) => {
        return { id: 'balls', type: 'themePark' };
      },
      type: PlaceType,
    }
  }),
  name: 'Query'
});

export default new GraphQLSchema({
  query: queryType,
  types: [ThemeParkType],
});
