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
  description: 'A character in the Star Wars Trilogy',
  fields: () => ({
    id: {
      description: 'The id of the character.',
      type: new GraphQLNonNull(GraphQLString)
    },
    type: {
      description: 'The name of the character.',
      type: GraphQLString
    },
  }),
  name: 'Place',
  resolveType(character) {
    if (character.type === 'themePark') {
      return ThemeParkType;
    }

    return ThemeParkType;
  },
});

export default PlaceType;