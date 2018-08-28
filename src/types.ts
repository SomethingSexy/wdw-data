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

export interface ILocation {
  address?: any;
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
