import Sequelize from 'sequelize';

export default sequelize => {
  const BusStop = sequelize.define(
    'bus_stop',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: Sequelize.STRING
    }
  );

  return BusStop;
};
