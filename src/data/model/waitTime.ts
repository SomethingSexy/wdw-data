import Sequelize from 'sequelize';

export default sequelize => {
  const WaitTime = sequelize.define(
    'waittime',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      }
    }
  );

  return WaitTime;
};
