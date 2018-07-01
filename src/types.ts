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
  parks: {
    hours: string;
    name: string;
    extraMagic?: string | undefined;
  };
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
