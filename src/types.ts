export interface IRestaurantItem {
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

export interface IActivityItem {
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
  thrills?: string[];
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
  description: string;
  // internal id
  id?: string;
  extId: string;
  extRefName: string;
  fetchSchedule?: boolean;
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

export interface IActivities {
  findAll: (where?: { [key: string]: string | boolean }) => Promise<IActivity[]>;
}

export interface IActivitiesModels {
  Activity: any;
  Date: any;
  Location: any;
  Locations: ILocationsConstructor;
}

export interface IActivityModels {
  Date: any;
  Location: any;
  Locations: ILocationsConstructor;
}

export interface IActivity {
  addWaitTimes: (timeStamp: string, waitTime: IWaitTime, transaction?) => Promise<{}>;
  bulkAddSchedules: (schedules: {[date: string]: ISchedule[]}) => {};
  data: IActivityItem;
  load: (include?: any[]) => Promise<boolean> ;
  upsert: (item: IActivityItem, transaction?) => Promise<string>;
}

export interface IShopModels {
  Locations: ILocationsConstructor;
}

export interface IShopsModels {
  Location: any;
  Locations: ILocationsConstructor;
  Shop: any;
}

export interface ILocationModels {
  Date: any;
}

export interface ILocationsModels {
  Date: any;
  Location: ILocationConstructor;
}

export interface IRestaurant {
  data: IRestaurantItem;
  load: (include?: any[]) => Promise<boolean> ;
  upsert: (item: IRestaurantItem, transaction?) => Promise<string>;
}

export interface IRestaurants {
  findAll: (where?: { [key: string]: string | boolean }) => Promise<IRestaurant[]>;
}

export interface IRestaurantModels {
  Locations: ILocationsConstructor;
}

export interface IRestaurantsModels {
  Location: any;
  Locations: ILocationsConstructor;
  Restaurant: any;
}

export interface IWaitTime {
  fastPass: {
    available: boolean;
  };
  postedWaitMinutes: string;
  rollUpStatus: string;
  rollUpWaitTimeMessage: string;
  singleRider: boolean;
  status: string;
}

export interface IActivityWaitTime {
  extId: 'string';
  waitTime: IWaitTime;
}
