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

export interface IPlace {
  areas?: string[];
  extId: string;
  id: string;
  location: string;
  name: string;
  type: string;
}
