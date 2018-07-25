import Sequelize from 'sequelize';

export default sequelize => {
  const WaitTime = sequelize.define(
    'waittime',
    {
      fastPassAvailable: Sequelize.BOOLEAN,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      singleRider: Sequelize.BOOLEAN,
      status: Sequelize.STRING,
      statusMessage: Sequelize.STRING,
      timestamp: Sequelize.DATE,
      wait: Sequelize.INTEGER,
      waitMessage: Sequelize.STRING
    }
  );

  return WaitTime;
};
