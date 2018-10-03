export const mockSequelize = {
  transaction: callback => {
    return callback({});
  }
};
export const mockLogger = (type: string, message: string) => {}; // tslint:disable-line
export class MockShop {
  // tslint:disable-next-line:no-empty
  public data;
  // tslint:disable-next-line:no-empty
  public upsert() {}
  // tslint:disable-next-line:no-empty
  public get() { }
    // tslint:disable-next-line:no-empty
  public async load() { return true; }
}

// tslint:disable-next-line:max-classes-per-file
export class MockLocation {
  // tslint:disable-next-line:no-empty
  public addArea() {}
  // tslint:disable-next-line:no-empty
  public findAreaByName() {}
  // tslint:disable-next-line:no-empty
  public findByName() {}
}

export const mockShopDao = {
  // tslint:disable-next-line:no-empty
  addShopTags: () => {},
  // tslint:disable-next-line:no-empty
  findOne: () => {},
  // tslint:disable-next-line:no-empty
  get: () => {},
  // tslint:disable-next-line:no-empty
  hasShopTags: () => {},
  // tslint:disable-next-line:no-empty
  setArea: () => {},
  // tslint:disable-next-line:no-empty
  setLocation: () => {}
};

export const mockAddressDao = {
  // tslint:disable-next-line:no-empty
  get: () => {}
};

export const mockActivityDao = {
  // tslint:disable-next-line:no-empty
  get: () => {}
};

export const mockAreaDao = {
  // tslint:disable-next-line:no-empty
  get: () => {}
};

export const mockLocationDao = {
  // tslint:disable-next-line:no-empty
  findOne: () => {},
  // tslint:disable-next-line:no-empty
  get: () => {}
};

export const mockShopDiscountDao = {
  // tslint:disable-next-line:no-empty
  create: () => {},
  // tslint:disable-next-line:no-empty
  findAll: () => {}
};

export const createLocationInstance = (id, data) =>  {
  // tslint:disable-next-line:max-classes-per-file
  class InstanceLocation {
    public get(options: any) {
      if (options === 'id') {
        return id;
      }
      return data;
    }
  }

  return new InstanceLocation();
};

export const createShopInstance = (id, data) =>  {
  // tslint:disable-next-line:max-classes-per-file
  class InstanceShop {
    public get(options: any) {
      if (options === 'id') {
        return id;
      }
      return data;
    }
  }

  return new InstanceShop();
};

export const mockTransaction = {};

// tslint:disable-next-line:max-classes-per-file
export class MockDate {
  // tslint:disable-next-line:no-empty
  public async load() {}
}

export const createDateInstance = (id, data) =>  {
  // tslint:disable-next-line:max-classes-per-file
  class InstanceDate {
    // tslint:disable-next-line:no-empty
    public async addSchedule() {}
    public get(options: any) {
      if (options === 'id') {
        return id;
      }
      return data;
    }
  }

  return new InstanceDate();
};

export const mockLocationScheduleDao = {
  // tslint:disable-next-line:no-empty
  findOne: () => {}
};

export const mockScheduleDao = {
  // tslint:disable-next-line:no-empty
  async create() {}
};

export const createScheduleInstance = (id, data) =>  {
  // tslint:disable-next-line:max-classes-per-file
  class InstanceSchedule {
    // tslint:disable-next-line:no-empty
    public async addSchedule() {}
    public get(options: any) {
      if (options === 'id') {
        return id;
      }
      return data;
    }
  }

  return new InstanceSchedule();
};