import { expect } from 'chai';
import { graphql } from 'graphql';
import 'mocha';
import schema from '../../src/schema/index';

describe('schema', () => {
  describe('place', () => {
    it.only('should fetch a single place by id', async () => {
      const query = `
        query PlaceQuery {
          place(id: "balls") {
            id
          }
        }
      `;
      const result = await graphql(schema, query);
      expect(result).to.deep.equal({
        data: {
          place: {
            id: 'balls',
          },
        },
      });
    });
  });
});
