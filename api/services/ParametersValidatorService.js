function errorMsgOneOfEntityExist(entitiesType) {
  return {
    message: `You must provide one existing entity id. The entity can be: ${entitiesType
      .map((e) => `'${e}'`)
      .join(',')} `,
  };
}
async function checkOneOfEntityExist(req, res, possibleEntities) {
  const ENTITIES_MODEL = {
    cave: TCave,
    entrance: TEntrance,
    exit: TEntrance,
    document: TDocument,
    massif: TMassif,
    point: TPoint,
    grotto: TGrotto,
  };

  const possibleEntitesMixed = possibleEntities.map((e) => [e, req.param(e)]);
  const entity = possibleEntitesMixed.find(([, v]) => v !== undefined);
  if (!entity) {
    res.badRequest(errorMsgOneOfEntityExist(possibleEntities));
    return false;
  }

  const [entityType, entityId] = entity;
  if (!ENTITIES_MODEL[entityType]) {
    sails.log.error(
      'ParametersValidatorService checkOneOfEntityExist: Missing entity model mapping',
      entityType,
      possibleEntitesMixed
    );
    res.badRequest(errorMsgOneOfEntityExist(possibleEntities));
    return false;
  }

  const row = await ENTITIES_MODEL[entityType].findOne({
    id: entityId,
    isDeleted: false,
  });
  if (!row) {
    res.badRequest(errorMsgOneOfEntityExist(possibleEntities));
    return false;
  }

  return {
    type: entityType,
    id: entityId,
    value: row,
  };
}

function errorMsgCheckAllExist(parametersName) {
  return {
    message: `The following parameters are mandatory: ${parametersName
      .map((e) => `'${e}'`)
      .join(', ')} `,
  };
}
function checkAllExist(req, res, params) {
  const values = params.map((e) => req.param(e));
  if (values.some((e) => !e)) {
    res.badRequest(errorMsgCheckAllExist(params));
    return false;
  }
  return values;
}

module.exports = {
  checkOneOfEntityExist,
  errorMsgOneOfEntityExist,
  checkAllExist,
  errorMsgCheckAllExist,
};
