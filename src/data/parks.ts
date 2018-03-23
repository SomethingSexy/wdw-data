import { IPlace } from '../types';

// Add here because Typescript and json files are a bitch apparently
// could probably switch this back to a .json file and use require instead
const parks: IPlace[] = [{
  areas: [''],
  extId: '80007944;entityType=theme-park',
  id: 'f2b7e336-e180-4fd5-afb9-a781d29de684',
  location: '',
  name: 'Magic Kingdom Park',
  type: 'themePark'
}, {
  areas: [''],
  extId: '80007838;entityType=theme-park',
  id: '36521a3e-56c4-4411-a6be-25a1d0c651db',
  location: '',
  name: 'Epcot',
  type: 'themePark'
}, {
  areas: [''],
  extId: '80007998;entityType=theme-park',
  id: 'ae57b945-8b81-43ea-ad64-35f8a440cafd',
  location: '',
  name: 'Disney\'s Hollywood Studios',
  type: 'themePark'
}, {
  areas: [''],
  extId: '80007823;entityType=theme-park',
  id: '374db907-9c5b-4eb7-ae4a-4c696c3b5087',
  location: '',
  name: 'Disney\'s Animal Kingdom Theme Park',
  type: 'themePark'
}, {
  areas: [''],
  extId: '80007981;entityType=water-park',
  id: '395c4d95-95a7-4e27-8caf-a35f53fd3e04',
  location: '',
  name: 'Disney\'s Typhoon Lagoon Water Park',
  type: 'waterPark'
}, {
  areas: [''],
  extId: '80007834;entityType=water-park',
  id: '03db0921-3223-46c2-9306-e4644e567c13',
  location: '',
  name: 'Disney\'s Blizzard Beach Water Park',
  type: 'waterPark'
}, {
  areas: [''],
  extId: '10460;entityType=Entertainment-Venue',
  id: '2fbe81a2-e3c1-4d23-b1d7-c121b478aebf',
  location: '',
  name: 'Disney Springs',
  type: 'venue'
}, {
  areas: [''],
  extId: '80008033;entityType=Entertainment-Venue',
  id: '0619a388-05fc-45e8-81c8-5fba1a9b5167',
  location: '',
  name: 'ESPN Wide World of Sports Complex',
  type: 'venue'
}];

export default parks;
