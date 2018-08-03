import Sequelize from 'sequelize';

export default sequelize => {
  const LocationSchedules = sequelize.define(
    'activities_schedules',
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
