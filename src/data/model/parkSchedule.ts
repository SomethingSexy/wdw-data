import Sequelize from 'sequelize';

export default sequelize => {
  const ParkSchedules = sequelize.define(
    'park_schedules',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      }
    }
  );

  return ParkSchedules;
};
