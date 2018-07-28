import Sequelize from 'sequelize';

export default sequelize => {
  const Age = sequelize.define(
    'age',
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
        fields: ['name'],
        unique: true
      }]
    }
  );

  return Age;
};
