import Sequelize from 'sequelize';

/**
 * TODO:
 *  - add address
 */
export default sequelize => {
  const LocationArea = sequelize.define(
    'locationArea',
    {
      description: Sequelize.TEXT,
      extId: Sequelize.STRING,
      extRefName: Sequelize.STRING,
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
      }]
    }
  );

  return LocationArea;
};
