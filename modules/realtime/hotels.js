"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_address_1 = __importDefault(require("parse-address"));
const screen_1 = require("./api/screen");
const path = 'https://disneyworld.disney.go.com/resorts/';
/**
 * Retrieves detailed information about a hotel, internal for processing list.
 * @param {string} url
 */
const details = async ({}, item) => {
    // need to massage url here
    const url = item.url.substring(0, item.url.indexOf('/rates-rooms/'));
    const extRefName = url.substring(path.length, url.length);
    const screen = await screen_1.grab(url);
    const $ = screen.html();
    const $page = $.find('.resortsPage');
    const name = $page.find('h1').text();
    const description = $page.find('.description').text().trim();
    const $address = $page.find('.addressBlock');
    const addressLineOne = $address.find('.address1').text();
    const addressRest = $address.find('.cityStatePostalCode').text();
    const tier = $page.find('.resortTier').next().text();
    const area = $page.find('.resortArea').next().text();
    return {
        area,
        description,
        extRefName,
        name,
        tier,
        url,
        address: parse_address_1.default.parseLocation(`${addressLineOne}, ${addressRest} `) // tslint:disable-line
    };
};
exports.list = async () => {
    const screen = await screen_1.grab(path);
    return screen.getItems(details);
};
//# sourceMappingURL=hotels.js.map