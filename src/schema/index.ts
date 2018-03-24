import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString
} from 'graphql';
import placeModel from '../model/place';
import AttractionType from './Attraction';
import DiningType from './Dining';
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
      resolve: (_, { id }) => {
        return placeModel.get(id);
      },
      type: PlaceType,
    },
    places: {
      resolve: _ => {
        return placeModel.getAll();
      },
      type: new GraphQLList(PlaceType),
    }
  }),
  name: 'Query'
});

export default new GraphQLSchema({
  query: queryType,
  types: [AttractionType, DiningType, ThemeParkType],
});
