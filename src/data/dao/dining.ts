import Sequelize from 'sequelize';

/**
 * TODO:
 *  - add address
 */
export default sequelize => {
  const Dining = sequelize.define(
    'dining',
    {
      admissionRequired: Sequelize.BOOLEAN,
      costDescription: Sequelize.TEXT,
      description: Sequelize.TEXT,
      diningEvent: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      extId: Sequelize.STRING,
      extRefName: Sequelize.STRING,
      fetchSchedule: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      name: Sequelize.STRING,
      quickService: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      tableService: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
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

  return Dining;
};
