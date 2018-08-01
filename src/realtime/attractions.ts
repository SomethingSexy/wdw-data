import { get as requestGet, getAccessToken } from './api/request';
import { grab } from './api/screen';

const path = 'https://disneyworld.disney.go.com/attractions/';

const NO_SERVICE_ANIMALS_ID = '16983973';
const MUST_TRANSFER_WHEELCHAIR = '16669963';
// const ages = {
//   ALL_AGES: '16669938'
// };

const facetHasId = (facet: any[], id: string) =>
  facet && Array.isArray(facet) && !!facet.find(check => check.id === id);

/**
 * Retreives information about all attractions.
 */
export const list = async () => {
  const screen = await grab(path);
  const attractions = await screen.getItems();
  return Promise.all(
    attractions.map(async attraction => get(attraction))
  );
};

/**
 * Retrieves additional details about an attraction.
 * @param {object} attraction
 */
export const get = async (attraction: { extId: string },) => {
  const url = `/global-pool-override-A/facility-service/attractions/${attraction.extId}`;
  const auth = await getAccessToken();
  const response: any = await requestGet(url, {}, auth);

  let coordinates;
  if (response.coordinates && response.coordinates['Guest Entrance']) {
    coordinates = response.coordinates['Guest Entrance'];
  }

  const { admissionRequired, descriptions, facets } = response;
  const { age, interests } = facets;
  // console.log(facets);
  const allowServiceAnimals = !facetHasId(facets.serviceAnimals, NO_SERVICE_ANIMALS_ID);
  const wheelchairTransfer = facetHasId(facets.mobilityDisabilities, MUST_TRANSFER_WHEELCHAIR);
  const tags = interests && interests.map(interest => interest.value);
  const ages = age && facets.age.map(a => a.value);
  const height = facets.height && facets.height[0].value;
  const thrillFactor = facets.thrillFactor && facets.thrillFactor.map(thrill => thrill.value);
  const description = descriptions.shortDescriptionMobile
    ? descriptions.shortDescriptionMobile.text : '';

  return {
    ...attraction,
    admissionRequired,
    ages,
    allowServiceAnimals,
    coordinates,
    description,
    height,
    tags,
    thrillFactor,
    wheelchairTransfer,
    // disneyOperated: response.disneyOperated,
    // disneyOwned: response.disneyOwned,
    extId: response.id,  // tslint:disable-line
    extRefName: response.urlFriendlyId,
    fastPassPlus: response.fastPassPlus,
    fastPass: response.fastPass,
    name: response.name, // TODO remove  - Now Open!
    links: {
      schedule: response.links.schedule,
      waitTimes: response.links.waitTimes
    },
    riderSwapAvailable: response.riderSwapAvailable
  };
};
