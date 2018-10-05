  /**
   * Searches for an area instance.
   * @param locationId
   * @param name
   * @param transaction
   */
  public async findAreaByName(locationId, name, transaction) {
    const { Area } = this.dao;
    return Area.findOne(
      { where: { locationId, name } }, { transaction }
    );
  }