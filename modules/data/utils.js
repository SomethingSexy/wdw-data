"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Error = Symbol('data:error');
exports.Success = Symbol('data:success');
exports.upsert = async (Model, values, condition, transaction, include) => {
    let options = { transaction };
    if (include) {
        options = Object.assign({}, options, { include });
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
exports.asyncTransaction = async (sequelize, items, call) => {
    return Promise.all(items
        .map(item => {
        return sequelize.transaction(async (t) => call(item, t));
    }));
};
exports.syncTransaction = async (sequelize, items, call) => {
    const responses = [];
    // handles updating all activities synchronously
    for (const item of items) {
        const response = await sequelize.transaction(async (t) => call(item, t));
        responses.push(response);
    }
    return responses;
};
//# sourceMappingURL=utils.js.map