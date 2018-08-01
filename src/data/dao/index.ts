import activity from './activity';
import address from './address';
import age from './age';
import area from './area';
import date from './date';
import hotel from './hotel';
import location from './location';
import locationSchedule from './locationSchedule';
import schedule from './schedule';
import tag from './tag';
import thrillFactor from './thrillFactor';
import waitTime from './waitTime';

export default sequelize => {
  // setup our data access objects
  const Activity = activity(sequelize);
  const Address = address(sequelize);
  const Age = age(sequelize);
  const Area = area(sequelize);
  const Location = location(sequelize);
  const LocationSchedule = locationSchedule(sequelize);
  const Schedule = schedule(sequelize);
  const Date = date(sequelize);
  const Hotel = hotel(sequelize);
  const Tag = tag(sequelize);
  const ThrillFactor = thrillFactor(sequelize);
  const WaitTime = waitTime(sequelize);

  // setup assocations
  Date.belongsToMany(Schedule, { through: LocationSchedule });
  Schedule.belongsToMany(Date, { through: LocationSchedule });
  LocationSchedule.belongsTo(Location);
  Hotel.belongsTo(Location);
  Location.belongsTo(Address);
  Location.hasMany(Area);
  // Splitting Area and Location but since they might not
  // always have an Area, instead of doing a join of the ids
  Activity.belongsTo(Location);
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

  // return all of our daos, no need to worry about any individual exports here
  // we are always going to use them
  return {
    Activity,
    Address,
    Age,
    Area,
    Date,
    Hotel,
    Location,
    LocationSchedule,
    Schedule,
    Tag,
    ThrillFactor,
    WaitTime
  };
};
