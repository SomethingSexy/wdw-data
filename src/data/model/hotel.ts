import Sequelize from 'sequelize';

/**
 * TODO:
 *  - add address
 */
export default sequelize => {
  const Hotel = sequelize.define(
    'hotel',
    {
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      tier: Sequelize.STRING
    }
  );

  return Hotel;
};
