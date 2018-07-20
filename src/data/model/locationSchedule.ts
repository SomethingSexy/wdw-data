import Sequelize from 'sequelize';

export default sequelize => {
  const LocationSchedules = sequelize.define(
    'location_schedule',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      }
    }
  );

  return LocationSchedules;
};
