"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const activity_1 = __importDefault(require("./activity"));
const activitySchedule_1 = __importDefault(require("./activitySchedule"));
const address_1 = __importDefault(require("./address"));
const age_1 = __importDefault(require("./age"));
const area_1 = __importDefault(require("./area"));
const busStop_1 = __importDefault(require("./busStop"));
const cuisine_1 = __importDefault(require("./cuisine"));
const date_1 = __importDefault(require("./date"));
const dining_1 = __importDefault(require("./dining"));
const hotel_1 = __importDefault(require("./hotel"));
const location_1 = __importDefault(require("./location"));
const locationSchedule_1 = __importDefault(require("./locationSchedule"));
const reservation_1 = __importDefault(require("./reservation"));
const room_1 = __importDefault(require("./room"));
const roomConfiguration_1 = __importDefault(require("./roomConfiguration"));
const schedule_1 = __importDefault(require("./schedule"));
const shop_1 = __importDefault(require("./shop"));
const shopDiscount_1 = __importDefault(require("./shopDiscount"));
const tag_1 = __importDefault(require("./tag"));
const thrillFactor_1 = __importDefault(require("./thrillFactor"));
const waitTime_1 = __importDefault(require("./waitTime"));
exports.default = sequelize => {
    // setup our data access objects
    const Activity = activity_1.default(sequelize);
    const ActivitySchedule = activitySchedule_1.default(sequelize);
    const Address = address_1.default(sequelize);
    const Age = age_1.default(sequelize);
    const Area = area_1.default(sequelize);
    const BusStop = busStop_1.default(sequelize);
    const Location = location_1.default(sequelize);
    const LocationSchedule = locationSchedule_1.default(sequelize);
    const Schedule = schedule_1.default(sequelize);
    const Date = date_1.default(sequelize);
    const Dining = dining_1.default(sequelize);
    const Cuisine = cuisine_1.default(sequelize);
    const Hotel = hotel_1.default(sequelize);
    const Reservation = reservation_1.default(sequelize);
    const Room = room_1.default(sequelize);
    const RoomConfiguration = roomConfiguration_1.default(sequelize);
    const Shop = shop_1.default(sequelize);
    const ShopDiscount = shopDiscount_1.default(sequelize);
    const Tag = tag_1.default(sequelize);
    const ThrillFactor = thrillFactor_1.default(sequelize);
    const WaitTime = waitTime_1.default(sequelize);
    // setup assocations
    Date.belongsToMany(Schedule, { through: LocationSchedule });
    Schedule.belongsToMany(Date, { through: LocationSchedule });
    // TODO: Is this right?
    LocationSchedule.belongsTo(Location);
    LocationSchedule.belongsTo(Schedule);
    LocationSchedule.belongsTo(Date);
    Hotel.belongsTo(Location);
    Room.hasMany(RoomConfiguration);
    Hotel.hasMany(Room);
    Hotel.hasMany(BusStop);
    Location.belongsTo(Address);
    Location.hasMany(Area);
    Dining.belongsTo(Location);
    Dining.belongsTo(Area);
    Location.hasMany(Dining);
    Tag.belongsToMany(Dining, { as: 'DiningTags', through: 'dinings_tags' });
    Dining.belongsToMany(Tag, { as: 'DiningTags', through: 'dinings_tags' });
    Cuisine.belongsToMany(Dining, { as: 'DiningCuisines', through: 'cuisines_dinings' });
    Dining.belongsToMany(Cuisine, { as: 'DiningCuisines', through: 'cuisines_dinings' });
    Dining.hasMany(Reservation);
    Date.hasMany(Reservation);
    Shop.belongsTo(Location);
    Shop.belongsTo(Area);
    Location.hasMany(Shop);
    Tag.belongsToMany(Shop, { as: 'ShopTags', through: 'shops_tags' });
    Shop.belongsToMany(Tag, { as: 'ShopTags', through: 'shops_tags' });
    Shop.hasMany(ShopDiscount);
    ShopDiscount.belongsTo(Shop);
    // Splitting Area and Location but since they might not
    // always have an Area, instead of doing a join of the ids
    Activity.belongsTo(Location);
    Location.hasMany(Activity);
    Activity.belongsTo(Area);
    Activity.belongsToMany(ThrillFactor, { as: 'ThrillFactors', through: 'activities_thrill_factors' });
    ThrillFactor.belongsToMany(Activity, { as: 'ThrillFactors', through: 'activities_thrill_factors' });
    WaitTime.belongsTo(Date);
    Activity.hasMany(WaitTime);
    Age.belongsToMany(Activity, { as: 'ActivityAges', through: 'activities_ages' });
    Activity.belongsToMany(Age, { as: 'ActivityAges', through: 'activities_ages' });
    Tag.belongsToMany(Activity, { as: 'ActivityTags', through: 'activities_tags' });
    Activity.belongsToMany(Tag, { as: 'ActivityTags', through: 'activities_tags' });
    Date.belongsToMany(Schedule, { as: 'ActivitySchedule', through: ActivitySchedule });
    Schedule.belongsToMany(Date, { as: 'ActivitySchedule', through: ActivitySchedule });
    ActivitySchedule.belongsTo(Activity);
    ActivitySchedule.belongsTo(Schedule);
    ActivitySchedule.belongsTo(Date);
    // TODO:
    // Setup RoomRates, Bus Wait Times, Dining, ADRs
    // return all of our daos, no need to worry about any individual exports here
    // we are always going to use them
    return {
        Activity,
        ActivitySchedule,
        Address,
        Age,
        Area,
        BusStop,
        Cuisine,
        Date,
        Dining,
        Hotel,
        Location,
        LocationSchedule,
        Room,
        RoomConfiguration,
        Schedule,
        Shop,
        ShopDiscount,
        Tag,
        ThrillFactor,
        WaitTime
    };
};
//# sourceMappingURL=index.js.map