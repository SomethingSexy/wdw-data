import { grab } from './api/screen';
const path = 'https://disneyworld.disney.go.com/entertainment/';

const ageKeys = ['All Ages', 'Preschoolers', 'Kids', 'Tweens', 'Teens', 'Adults'];
const NO_WHEELCHAIR_TRANSFER = 'May Remain in Wheelchair/ECV';
const ADMISSION_REQUIRED = 'Valid Park Admission Required';

/**
 * Retrieves detailed information about an entertainment activity, internal for processing list.
 * @param {string} url
 */
const details = async ($item, item) => {
  const $description = $item.find('.descriptionLines');
  const $facets = $description.find('.facets');
  const facets = $facets
    .first()
    .text()
    .split(',')
    .filter(detail => detail !== '')
    .map(detail => detail.trim()) || [];

  const ages: string[] = [];
  const tags: string[] = [];
  facets.forEach(detail => {
    if (ageKeys.includes(detail)) {
      ages.push(detail);
    } else {
      tags.push(detail);
    }
  });

  const screen = await grab(item.url);

  const $ = screen.html();
  const $page = $.find('#pageContent');
  const $restrictions = $page
    .find('.moreDetailsInfo .modalContainer .moreDetailsModal-accessibility');
  const wheelchairTransfer = $restrictions
    .find('.moreDetailsModalItem-wheelchair-access')
    .text()
    .trim() !== NO_WHEELCHAIR_TRANSFER;
  const admissionRequired = $page.find('.themeParkAdmission').text().trim() === ADMISSION_REQUIRED;
  const description = $page.find('.finderDetailsPageSubtitle').text().trim();
  // <li class="moreDetailsModalItem-audio-description">Audio Description</li>
  // <li class="moreDetailsModalItem-sign-language">Sign Language</li>
  // <li class="moreDetailsModalItem-handheld-captioning">Handheld Captioning</li>
  // <li class="moreDetailsModalItem-assistive-listening">Assistive Listening</li>

  // TODO: add length if it exists
  return {
    admissionRequired,
    ages,
    description,
    tags,
    wheelchairTransfer
  };
};

/**
 * Reloads cached data.
 */
export const list = async () => {
  const screen = await grab(path);

  return screen.getItems(details);
};

/**
 * Retrieves the schedules for all of the entertainment for a given day.  Returns them
 * by activity extId.
 *
 * @param start
 * @param end
 */
export const schedule = async(start: string): Promise<{ [date: string]: ISchedule[] }> => {

};
