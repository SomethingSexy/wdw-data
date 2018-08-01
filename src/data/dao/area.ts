import Sequelize from 'sequelize';

export default sequelize => {
  const Area = sequelize.define(
    'area',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: Sequelize.STRING
    },
    {
      indexes: [{
        fields: ['name', 'locationId'],
        unique: true
      }]
    }
  );

  return Area;
};
