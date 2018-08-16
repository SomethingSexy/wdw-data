import Sequelize from 'sequelize';

export default sequelize => {
  const Room = sequelize.define(
    'room',
    {
      bedsDescription: Sequelize.TEXT,
      description: Sequelize.TEXT,
      extId: Sequelize.STRING,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: Sequelize.STRING,
      occupancy: Sequelize.INTEGER,
      occupancyDescription: Sequelize.TEXT,
      pricingUrl: Sequelize.STRING,
      view: Sequelize.STRING // todo this should be another table
    }
  );

  return Room;
};
