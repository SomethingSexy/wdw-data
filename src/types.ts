export interface IDining {
  id: string;
  location: string;
  name: string;
  type: string;
}

export interface IAttraction {
  id: string;
  location: string;
  name: string;
  type: string;
}

export interface IHotel {
  // internal id
  id?: string;
  extId: string;
  extRefName: string;
  location: string;
  name: string;
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
  date: string;
  type: string;
  closing: string;
  isHoliday: boolean | string;
  isSpecialHours: boolean;
  opening: string;
}
