
export const parseLocation = raw => {
  if (!raw || raw === '') {
    return null;
  }

  const groups = raw.split(',');

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

export const parseExternal = raw => {
  if (!raw) {
    return null;
  }
  const type = new RegExp(/\d+;entityType=([\w-]+)/, 'g').exec(raw);

  return {
    extId: raw,
    id: type ? type[0] : '',
    type: type ? type[1].toLowerCase() : ''
  };
};
