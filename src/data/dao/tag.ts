import Sequelize from 'sequelize';

export default sequelize => {
  const Tag = sequelize.define(
    'tag',
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

  return Tag;
};
