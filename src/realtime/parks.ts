import { grab } from './api/screen';

const path = 'https://disneyworld.disney.go.com/destinations/';

export const list = async () => {
  const screen = await grab(path);

  return screen.getItems();
};
