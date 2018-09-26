import activity from './activity';
import activitySchedule from './activitySchedule';
import address from './address';
import age from './age';
import area from './area';
import busStop from './busStop';
import cuisine from './cuisine';
import date from './date';
import dining from './dining';
import hotel from './hotel';
import location from './location';
import locationSchedule from './locationSchedule';
import reservation from './reservation';
import room from './room';
import roomConfiguration from './roomConfiguration';
import schedule from './schedule';
import shop from './shop';
import shopDiscount from './shopDiscount';
import tag from './tag';
import thrillFactor from './thrillFactor';
import waitTime from './waitTime';

export default sequelize => {
  // setup our data access objects
  const Activity = activity(sequelize);
  const ActivitySchedule = activitySchedule(sequelize);
  const Address = address(sequelize);
  const Age = age(sequelize);
  const Area = area(sequelize);
  const BusStop = busStop(sequelize);
  const Location = location(sequelize);
  const LocationSchedule = locationSchedule(sequelize);
  const Schedule = schedule(sequelize);
  const Date = date(sequelize);
  const Dining = dining(sequelize);
  const Cuisine = cuisine(sequelize);
  const Hotel = hotel(sequelize);
  const Reservation = reservation(sequelize);
  const Room = room(sequelize);
  const RoomConfiguration = roomConfiguration(sequelize);
  const Shop = shop(sequelize);
  const ShopDiscount = shopDiscount(sequelize);
  const Tag = tag(sequelize);
  const ThrillFactor = thrillFactor(sequelize);
  const WaitTime = waitTime(sequelize);

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

  Activity.belongsToMany(
    ThrillFactor, { as: 'ThrillFactors', through: 'activities_thrill_factors' }
  );
  ThrillFactor.belongsToMany(
    Activity, { as: 'ThrillFactors', through: 'activities_thrill_factors' }
  );

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
