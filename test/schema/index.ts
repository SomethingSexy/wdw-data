// import { expect } from 'chai';
// import { graphql } from 'graphql';
// import 'mocha';
// import schema from '../../src/schema/index';

// describe('schema', () => {
//   describe('place', () => {
//     it('should fetch a single place by id', async () => {
//       const query = `
//         query PlaceQuery {
//           place(id: "f2b7e336-e180-4fd5-afb9-a781d29de684") {
//             id,
//             name,
//             type
//           }
//         }
//       `;
//       const result = await graphql(schema, query);
//       expect(result).to.deep.equal({
//         data: {
//           place: {
//             id: 'f2b7e336-e180-4fd5-afb9-a781d29de684',
//             name: 'Magic Kingdom Park',
//             type: 'themePark'
//           },
//         },
//       });
//     });

//     it('should fetch all places', async () => {
//       const query = `
//         query PlacesQuery {
//           places {
//             id,
//             name,
//             type
//           }
//         }
//       `;
//       const result = await graphql(schema, query);
//       expect(result).to.be.a('object');
//       expect(result.data).to.be.a('object');
//       expect(result.data.places).to.be.a('array');
//       expect(result.data.places.length > 0).to.equal(true);
//       const place = result.data.places.find(p => p.id === 'f2b7e336-e180-4fd5-afb9-a781d29de684');
//       expect(place).to.deep.equal({
//         id: 'f2b7e336-e180-4fd5-afb9-a781d29de684',
//         name: 'Magic Kingdom Park',
//         type: 'themePark'
//       });
//     });
//   });

//   describe('locations', () => {
//     it('should fetch all locations', async () => {
//       const query = `
//         query LocationsQuery {
//           locations {
//             areas,
//             id,
//             name
//           }
//         }
//       `;
//       const result = await graphql(schema, query);
//       expect(result).to.be.a('object');
//       expect(result.data).to.be.a('object');
//       expect(result.data.locations).to.be.a('array');
//       expect(result.data.locations.length > 0).to.equal(true);
//     });
//   });
// });
