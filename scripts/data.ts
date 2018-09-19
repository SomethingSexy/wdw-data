import data from '../src/worker/data';

data({ shops: true }).then(() => process.exit);
