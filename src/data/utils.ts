export const Error = Symbol('data:error');
export const Success = Symbol('data:success');

export const upsert = async (Model, values, condition, transaction, include?) => {
  let options: any = { transaction };
  if (include) {
    options = {
      ...options,
      include
    };
  }
  return Model
    .findOne({ where: condition }, { transaction })
    .then(obj => {
      if (obj) {
        return obj.update(values, options);
      }

      return Model.create(values, options);
    });
};

export const asyncTransaction = async (sequelize, items, call) => {
  return Promise.all(
    items
      .map(item => {
        return sequelize.transaction(async t => call(item, t));
      })
    );
};

export const syncTransaction = async (sequelize, items, call) => {
  const responses: any = [];
  // handles updating all activities synchronously
  for (const item of items) {
    const response = await sequelize.transaction(async t => call(item, t));
    responses.push(response);
  }

  return responses;
};
