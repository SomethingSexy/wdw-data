import Sequelize from 'sequelize';

export default sequelize => {
  const Reservation = sequelize.define(
    'reservation',
    {
      // dateId, - date of reservation
      // diningId,
      // dateChecked - probably just string of the when we checked it last
      // time
      // open?
      // daysOut - reservation date - minus current date
      // startDate - defaults to current date
      // endDate - defaults to null
      dateChecked: Sequelize.DATE,
      daysOut: Sequelize.INTEGER,
      endDate: Sequelize.DATE,
      id: {
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      open: Sequelize.BOOLEAN,
      startDate: Sequelize.DATE,
      time: Sequelize.STRING,
    },
    {
      indexes: [{
        fields: ['endDate', 'startDate'],
      }]
    }
  );

  return Reservation;
};
