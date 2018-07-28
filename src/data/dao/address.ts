import Sequelize from 'sequelize';

export default sequelize => {
  const Address = sequelize.define(
    'address',
    {
      city: Sequelize.STRING,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      number: Sequelize.STRING,
      plus4: {
        type: Sequelize.TEXT,
        validate: {
          len: [4,4]
        }
      },
      prefix: Sequelize.STRING,
      state: Sequelize.STRING,
      street: Sequelize.STRING,
      type: Sequelize.STRING,
      zip: {
        type: Sequelize.TEXT,
        validate: {
          len: [5,5]
        }
      }
    }
  );

  return Address;
};
