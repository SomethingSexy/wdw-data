import Sequelize from 'sequelize';

export default sequelize => {
  const Park = sequelize.define(
    'park',
    {
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

  return Park;
};
