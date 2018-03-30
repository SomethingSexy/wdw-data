import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

const locationType = new GraphQLObjectType({
  description: 'Location in WDW.',
  fields: () => ({
    areas: {
      description: 'Areas within a location',
      type: new GraphQLList(GraphQLString)
    },
    id: {
      description: 'The id of the park',
      type: new GraphQLNonNull(GraphQLString)
    },
    name: {
      description: 'The name of the place',
      type: GraphQLString
    }
  }),
  name: 'Location'
});

export default locationType;
