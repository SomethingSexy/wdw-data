import {
  graphql,
  GraphQLInterfaceType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';
import placeModel from '../model/place';
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
        return placeModel.get(id);
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
