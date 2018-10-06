import data from '../src/worker/data';

data({ hotels: true }).then(() => process.exit);
