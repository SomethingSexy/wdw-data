import schedules from '../src/worker/schedules';

schedules(10).then(() => process.exit);
