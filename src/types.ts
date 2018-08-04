export interface IDining {
  id: string;
  location: string;
  name: string;
  type: string;
}

export interface IAttraction {
  id: string;
  extId: string;
  location: string;
  name: string;
  type: string;
}

export interface IHotel {
  // internal id
  address: any;
  id?: string;
  extId: string;
  extRefName: string;
  location: string;
  name: string;
  tier: string;
  type: string;
  url: string;
}

export interface IPlace {
  areas?: string[];
  extId: string;
  id: string;
  location: string;
  name: string;
  type: string;
}

export interface IDate {
  date: string;
  isHoliday: boolean | string;
  holiday?: string;
}

export interface IPark {
  // internal id
  id?: string;
  extId: string;
  extRefName: string;
  name: string;
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
  pool: {
    max: number;
  };
  username: string;
}
