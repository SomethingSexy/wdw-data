export interface IDining {
  admissionRequired: boolean;
  area: string;
  costDescription: string;
  cuisine: string[];
  description: string;
  diningEvent: boolean;
  extId: string;
  extRefName: string;
  id: string;
  location: string;
  name: string;
  quickService: boolean;
  tableService: boolean;
  tags: string[];
  type: string;
  url: string;
}

export interface IDiscount {
  description: string;
  discount: string;
  location: string;
  name: string;
  type: string;
}

interface IShopDiscount {
  description: string;
  discount: string;
  type: string;
}

export interface IShop {
  admissionRequired: boolean;
  area: string;
  description: string;
  discounts?: IShopDiscount[];
  extId: string;
  extRefName: string;
  id?: string;
  location: string;
  name: string;
  tags: string[];
  type: string;
  url: string;
  wheelchairAccessible: boolean;
}

export interface IActivity {
  admissionRequired: boolean;
  ages?: string[];
  allowServiceAnimals: boolean;
  area?: string;
  coordinates?: {
    gps: {
      latitude: number;
      longitude: number;
    }
  };
  description: string;
  id: string;
  extId: string;
  extRefName: string;
  fastPass: boolean;
  fastPassPlus: boolean;
  height: string;
  location: string;
  name: string;
  riderSwapAvailable: boolean;
  tags?: string[];
  thrillFactor?: string[];
  type: string;
  url: string;
  wheelchairTransfer: boolean;
}

export interface IDate {
  date: string;
  isHoliday: boolean | string;
  holiday?: string;
}

export interface ILocationItem {
  address?: any;
  areas?: any[];
  busStops?: string[];
  // internal id
  id?: string;
  extId: string;
  extRefName: string;
  name: string;
  rooms?: any[];
  tier?: string;
  type: string;
  url: string;
}

export interface IAvailability {
  link: string;
  time: string;
}

export interface IScreenItem {
  area: string;
  extId: string;
  extRefName: string;
  location: string;
  name: string;
  type: string;
  url: string;
}

export interface ISchedule {
  type: string;
  closing: string;
  isSpecialHours: boolean;
  opening: string;
}

export interface ISchedules {
  id: string;
  schedule: { [date: string]: ISchedule[] };
}

export interface IConnection {
  database: string;
  logging?: boolean;
  pool: {
    max: number;
  };
  username: string;
}

export interface ILogType { log: (type: string, message: string) => void; }

export type ILogger = (type: string, message: string) => void;

interface ILocationsConstructor {
  new (sequelize: any, access: any, logger: ILogger, models: ILocationsModels): ILocations;
}

export interface ILocations {
  findByName: (name: string, transaction?: any) => Promise<ILocation | null>;
}

interface ILocationConstructor {
  new (sequelize: any, access: any, logger: ILogger, models: ILocationModels, id: any): ILocation;
}

export interface ILocation {
  data: ILocationItem;
  instance: any;
  addArea: (name: string, transaction?: any) => Promise<any | null>;
  bulkAddSchedules: (parkSchedules: {[date: string]: ISchedule[]}) => {};
  findAreaByName: (name: string, transaction?: any) => Promise<any | null>;
}

export interface IShopsModels {
  Locations: ILocationsConstructor;
  Shop: any;
}

export interface IShopModels {
  Locations: ILocationsConstructor;
}

export interface ILocationModels {
  Date: any;
}

export interface ILocationsModels {
  Date: any;
  Location: ILocationConstructor;
}
