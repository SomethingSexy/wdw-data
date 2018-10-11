import invariant from 'invariant';
import moment from 'moment';
import 'moment-holiday';
import { ILogger } from '../../types';

class DateModel {
  public instance: any = null;

  // private sequelize: any;
  private dao: any;
  private logger: ILogger;
  private date: string;

  constructor(_, access, logger, date: string) {
    invariant(date, 'Date is required to create a date model.');

    // this.sequelize = sequelize;
    this.dao = access;
    this.logger = logger;
    this.date = date;
  }

  public get data() {
    // if no instance, throw an error
    invariant(this.instance, 'An instance is required to retrieve data, call load first.');
    return this.instance.get({ plain: true });
  }

  /**
   * Loads a date instance, in this case it will create a new date if
   * this one cannot be found.
   *
   * @param transaction
   */
  public async load(transaction?: any) {
    const { Date } = this.dao;
    const mDate = moment(this.date);
    const localDate = mDate.format('YYYY-MM-DD');

    const instance = await Date
      .findOne({ where: { date: localDate } }, { transaction })
      .then(d => {
        if (!d) {
          this.logger('debug', `${localDate} does not exist, creating.`)
          const holiday = mDate.isHoliday();
          return Date.create(
            {
              date: localDate,
              dayOfWeek: mDate.format('dddd'),
              holiday: holiday || null,
              isHoliday: !!holiday
            },
            { transaction }
          );
        }

        return Promise.resolve(d);
      });

    this.instance = instance;
    return true;
  }
}

export default DateModel;
