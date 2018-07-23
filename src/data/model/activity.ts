import Sequelize from 'sequelize';

/**
 * TODO:
 *  - add address
 */
export default sequelize => {
  const Activity = sequelize.define(
    'activity',
    {
      admissionRequired: Sequelize.BOOLEAN,
      age: Sequelize.STRING,
      allowServiceAnimals: Sequelize.BOOLEAN,
      description: Sequelize.TEXT,
      extId: Sequelize.STRING,
      extRefName: Sequelize.STRING,
      fastPass: Sequelize.BOOLEAN,
      fastPassPlus: Sequelize.BOOLEAN,
      height: Sequelize.STRING,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      latitude: Sequelize.REAL,
      longitude: Sequelize.REAL,
      name: Sequelize.STRING,
      riderSwapAvailable: Sequelize.BOOLEAN,
      type: Sequelize.STRING,
      url: Sequelize.STRING,
      wheelchairTransfer: Sequelize.BOOLEAN
    },
    {
      indexes: [{
        fields: ['extId'],
        unique: true
      }]
    }
  );

  return Activity;
};
