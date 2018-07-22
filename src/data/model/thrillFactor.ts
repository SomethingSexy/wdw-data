import Sequelize from 'sequelize';

export default sequelize => {
  const ThrillFactor = sequelize.define(
    'thrill_factor',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: {
        type: Sequelize.STRING,
        unique: true
      }
    }
  );

  return ThrillFactor;
};
