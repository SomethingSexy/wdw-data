import Sequelize from 'sequelize';

/**
 *
 */
export default sequelize => {
  const Location = sequelize.define(
    'location',
    {
      description: Sequelize.TEXT,
      extId: Sequelize.STRING,
      extRefName: Sequelize.STRING,
      fetchSchedule: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: Sequelize.STRING,
      type: Sequelize.STRING,
      url: Sequelize.STRING,
    },
    {
      indexes: [{
        fields: ['extId'],
        unique: true
      },
      { fields: ['name'] }]
    }
  );

  return Location;
};
