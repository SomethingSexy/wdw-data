import data from '../src/worker/data';

data({ parks: true }).then(() => process.exit);
