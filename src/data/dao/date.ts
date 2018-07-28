import Sequelize from 'sequelize';

export default sequelize => {
  const Date = sequelize.define(
    'date',
    {
      date: Sequelize.DATEONLY,
      holiday: Sequelize.STRING,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      isHoliday: Sequelize.BOOLEAN
    },
    {
      indexes: [{
        fields: ['date'],
        unique: true
      }]
    }
  );

  return Date;
};
