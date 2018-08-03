import moment from 'moment';
import 'moment-holiday';

export default (_, access) => {
  return {
    async get (scheduleDate: string, transaction) {
      const { Date } = access;
      const localDate = moment(scheduleDate).format('YYYY-MM-DD');

      return Date
        .findOne({ where: { date: localDate } }, { transaction })
        .then(d => {
          if (!d) {
            const mDate = moment(scheduleDate);
            const holiday = mDate.isHoliday();
            return Date.create(
              {
                date: scheduleDate,
                holiday: holiday || null,
                isHoliday: !!holiday
              },
              { transaction }
            );
          }

          return Promise.resolve(d);
        });
    }
  };
};
