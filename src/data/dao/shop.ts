import Sequelize from 'sequelize';

export default sequelize => {
  const Shop = sequelize.define(
    'shop',
    {
      admissionRequired: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
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
      wheelchairAccessible: {
        allowNull: false,
        defaultValue: true,
        type: Sequelize.BOOLEAN
      }
    },
    {
      indexes: [{
        fields: ['extId'],
        unique: true
      }]
    }
  );

  return Shop;
};
