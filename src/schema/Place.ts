import { GraphQLInterfaceType, GraphQLNonNull, GraphQLString } from 'graphql';
import AttractionType from './Attraction';
import DiningType from './Dining';
import ThemeParkType from './ThemePark';

// const PlaceType = new GraphQLUnionType({
//   description: 'A location at WDW',
//   name: 'Place',
//   resolveType: place => {
//     if (place.type === 'themePark') {
//       return ThemeParkType;
//     }

//     return ThemeParkType;
//   },
//   types: [ThemeParkType],
// });

const PlaceType =  new GraphQLInterfaceType({
  description: 'A character in the Star Wars Trilogy',
  fields: () => ({
    id: {
      description: 'The id of the place.',
      type: new GraphQLNonNull(GraphQLString)
    },
    type: {
      description: 'The type of the place',
      type: GraphQLString
    },
  }),
  name: 'Place',
  resolveType(place) {
    if (place.type === 'themePark'
      || place.type === 'waterPark'
      || place.type === 'venue'
    ) {
      return ThemeParkType;
    }

    // TODO: normalize these
    if (place.type === 'restaurant'
      || place.type === 'Dining'
      || place.type === 'Dinner') {
      return DiningType;
    }

    if (place.type === 'Attraction') {
      return AttractionType;
    }
    throw new Error(`Missing type for ${place.type}`);
  },
});

export default PlaceType;
