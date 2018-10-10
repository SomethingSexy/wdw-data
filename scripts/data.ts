import data from '../src/worker/data';

data({ attractions: true }).then(() => process.exit);
