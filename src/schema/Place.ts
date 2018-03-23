import { GraphQLInterfaceType, GraphQLNonNull, GraphQLString } from 'graphql';
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
  name: 'Place',
  description: 'A character in the Star Wars Trilogy',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'The id of the character.',
    },
    type: {
      type: GraphQLString,
      description: 'The name of the character.',
    },
  }),
  resolveType(character) {
    if (character.type === 'themePark') {
      return ThemeParkType;
    }

    return ThemeParkType;
  },
});

export default PlaceType;
