"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./api/request");
const screen_1 = require("./api/screen");
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
    const ages = [];
    const tags = [];
    facets.forEach(detail => {
        if (ageKeys.includes(detail)) {
            ages.push(detail);
        }
        else {
            tags.push(detail);
        }
    });
    const screen = await screen_1.grab(item.url);
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
exports.list = async () => {
    const screen = await screen_1.grab(path);
    return screen.getItems(details);
};
/**
 * Retrieves the schedules for all of the entertainment for a given day.  Returns them
 * by activity extId.
 *
 * @param start
 * @param end
 */
exports.schedule = async (start) => {
    const data = {
        date: start,
        filters: 'Entertainment',
        region: 'US',
        scheduleOnly: true
    };
    const auth = await request_1.getAccessToken();
    const response = await request_1.getWebApi('https://disneyworld.disney.go.com/entertainment/', data, auth);
    const activitySchedules = response.results.reduce((filtered, activity) => {
        if (!activity.schedule) {
            return filtered;
        }
        return [
            ...filtered,
            {
                id: activity.id,
                schedule: {
                    [start]: activity.schedule.schedules.map(s => ({
                        closing: s.endTime,
                        isSpecialHours: false,
                        opening: s.startTime,
                        type: s.type
                    }))
                }
            }
        ];
    }, []);
    return activitySchedules;
};
//# sourceMappingURL=entertainment.js.map