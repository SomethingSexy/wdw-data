"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const log_1 = __importDefault(require("../log"));
/**
 * A service for retrieving and persisting waitimes.
 */
exports.default = async (options = {
    attractions: true, dining: true, entertainment: true, hotels: true, parks: true, shops: true
}) => {
    // setup our database connection
    const models = await index_1.createModels({
        database: 'wdw',
        logging: true,
        pool: {
            max: 100 // TODO: only here because we are kicking off a shit ton of async inserts
        },
        username: 'tylercvetan',
    }, log_1.default);
    const realtimeModels = index_1.realtime(log_1.default);
    // // grab our realtime park data
    if (options.parks) {
        try {
            const parks = await realtimeModels
                .parks
                .list();
            log_1.default.log('info', JSON.stringify(parks, null, 4));
            await models.location.addUpdate(parks);
        }
        catch (e) {
            log_1.default.log('error', e.toString());
        }
    }
    if (options.hotels) {
        try {
            const hotels = await realtimeModels
                .hotels
                .list();
            log_1.default.log('info', JSON.stringify(hotels, null, 4));
            await models.location.addUpdate(hotels);
        }
        catch (e) {
            log_1.default.log('error', e.toString());
        }
    }
    if (options.attractions) {
        try {
            const attractions = await realtimeModels
                .attractions
                .list();
            log_1.default.log('info', JSON.stringify(attractions, null, 4));
            await models.activity.addUpdate(attractions);
        }
        catch (e) {
            log_1.default.log('error', e.toString());
        }
    }
    if (options.entertainment) {
        try {
            const entertainment = await realtimeModels
                .entertainment
                .list();
            log_1.default.log('info', JSON.stringify(entertainment, null, 4));
            await models.activity.addUpdate(entertainment);
        }
        catch (e) {
            log_1.default.log('error', e.toString());
        }
    }
    if (options.dining) {
        try {
            const dining = await realtimeModels
                .dining
                .list({ max: 50 });
            log_1.default.log('info', JSON.stringify(dining, null, 4));
            await models.dining.addUpdate(dining);
        }
        catch (e) {
            log_1.default.log('error', e.toString());
        }
    }
    if (options.shops) {
        try {
            const shops = await realtimeModels
                .shops
                .list({ max: 10 });
            log_1.default.log('info', JSON.stringify(shops, null, 4));
            // await models.activity.addUpdate(entertainment);
        }
        catch (e) {
            log_1.default.log('error', e.toString());
        }
    }
};
//# sourceMappingURL=data.js.map