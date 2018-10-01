const RAW_ROOM_ATTRIBUTES = [
  'bedsDescription',
  'occupancy',
  'occupancyDescription',
  'view',
  'description',
  'extId',
  'name',
  'pricingUrl'
];
const HOTEL_TYPE = 'resort';


public get data() {
  // if no instance, throw an error
  invariant(this.instance, 'An instance is required to retrieve data, call load first.');
  let raw = this.instance.get({ plain: true });

  // if this is a resort, then we need to grab the resort information
  if (raw.get('type') === 'resort') {
    const hotel = await Hotel
      .findOne({ where: { locationId: found.get('id') } }, { transaction });
    // just save off tier for now
    raw = {
      ...raw,
      tier: hotel.get('tier')
    };
  }

  return raw;
}

const addUpdateHotel = async (item: ILocation, access, transaction, logger) => {
  const { Address, BusStop, Hotel, Location, Room, RoomConfiguration } = access;
  logger('debug', `Adding/updating hotel ${item.extId}.`);

  const locationInstance = await upsert(
    Location, item, { extId: item.extId }, transaction, [Address]
  );
  const hotelInstance = await upsert(
    Hotel,
    { tier: item.tier, locationId: locationInstance.get('id') },
    { locationId: locationInstance.get('id') },
    transaction,
  );
  // need to handle adding rooms separately because we want to update
  // if we have them already based on the extId
  if (item.rooms) {
    for (const room of item.rooms) {
      const roomInstance = await upsert(
        Room,
        { ...pick(room, RAW_ROOM_ATTRIBUTES), hotelId: hotelInstance.get('id') },
        { extId: room.extId },
        transaction
      );

      if (room.configurations) {
        for (const configuration of room.configurations) {
          await upsert(
            RoomConfiguration,
            { ...configuration, roomId: roomInstance.get('id') },
            { description: configuration.description, roomId: roomInstance.get('id') },
            transaction
          );
        }
      }
    }
  }

  if (item.busStops) {
    // either sync or async with Promise.all
    for (const stop of item.busStops) {
      await BusStop
        .findOne({ where: { hotelId: hotelInstance.get('id'), name: stop } }, { transaction })
        .then(obj => {
          if (!obj) {
            return BusStop.create(
              { hotelId: hotelInstance.get('id'), name: stop }, { transaction }
            );
          }

          return Promise.resolve();
        });
    }
  }

  logger('debug', `Finished adding/updating hotel ${item.extId}.`);
  return locationInstance.get('id');
};