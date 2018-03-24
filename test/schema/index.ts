import { expect } from 'chai';
import { graphql } from 'graphql';
import 'mocha';
import schema from '../../src/schema/index';

describe('schema', () => {
  describe('place', () => {
    it('should fetch a single place by id', async () => {
      const query = `
        query PlaceQuery {
          place(id: "f2b7e336-e180-4fd5-afb9-a781d29de684") {
            id
          }
        }
      `;
      const result = await graphql(schema, query);
      expect(result).to.deep.equal({
        data: {
          place: {
            id: 'f2b7e336-e180-4fd5-afb9-a781d29de684',
          },
        },
      });
    });
  });
});
