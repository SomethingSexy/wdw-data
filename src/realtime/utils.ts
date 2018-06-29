
export const parseLocation = location => {
  if (!location || location === '') {
    return null;
  }

  const groups = location.split(',');

  if (groups.length === 0 || (groups.length === 1 && groups[0] === '')) {
    return null;
  }

  const main = groups[0].trim();
  let area;
  if (groups.length === 2) {
    area = groups[1].trim();
  }

  return { area, location: main };
};
