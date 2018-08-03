import schedules from '../src/worker/schedules';

schedules(2).then(() => process.exit);
