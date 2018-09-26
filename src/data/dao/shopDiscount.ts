import Sequelize from 'sequelize';

export default sequelize => {
  const ShopDiscount = sequelize.define(
    'shop_discount',
    {
      description: Sequelize.TEXT,
      discount: Sequelize.TEXT,
      fromDate: Sequelize.DATEONLY,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      thruDate: Sequelize.DATEONLY,
      type: Sequelize.TEXT
    }
  );

  return ShopDiscount;
};
