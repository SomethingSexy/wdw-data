import Sequelize from 'sequelize';

export default sequelize => {
  const Schedule = sequelize.define(
    'schedule',
    {
      closing: Sequelize.STRING,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      isSpecialHours: Sequelize.BOOLEAN,
      opening: Sequelize.STRING,
      type: Sequelize.STRING
    }
  );

  return Schedule;
};
