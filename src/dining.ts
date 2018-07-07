import diningModel from './model/dining';
import { reservations } from './realtime/dining';

export const list = async () => {
  const dinning = [];
  return dinning;
};

export const reservation = async (
  id: string,
  date: string,
  time: string,
  size: number
) => {
  const dining = await diningModel.get(id);
  return reservations({ id: dining.extId, url: dining.url }, date, time, size);
};
