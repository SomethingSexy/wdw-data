import Sequelize from 'sequelize';

export default sequelize => {
  const RoomConfiguration = sequelize.define(
    'room_configuration',
    {
      count: Sequelize.INTEGER,
      description: Sequelize.TEXT,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      }
    }
  );

  return RoomConfiguration;
};
