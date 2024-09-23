const ControllerService = require('../../../services/ControllerService');
const ElasticsearchService = require('../../../services/ElasticsearchService');
const NotificationService = require('../../../services/NotificationService');
const RightService = require('../../../services/RightService');
const { toCaver } = require('../../../services/mapping/converters');
const CaverService = require('../../../services/CaverService');

const DEFAULT_DELETED_CAVER_ID = 8;

module.exports = async (req, res) => {
  const isModerator = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const isAdministrator = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );

  const caverId = req.param('id');
  const caver = await CaverService.getCaver(caverId);
  if (!caver) {
    return res.notFound({ message: `Caver of id ${caverId} not found.` });
  }

  if (caverId === DEFAULT_DELETED_CAVER_ID)
    return res.forbidden('You are not authorized to delete this caver.');
  if (caver.type === 'CAVER' && !isAdministrator)
    return res.forbidden('You are not authorized to delete a caver.');
  if (caver.type === 'AUTHOR' && !isModerator)
    return res.forbidden('You are not authorized to delete an author.');

  const mergeIntoId = parseInt(req.param('entityId'), 10);
  let shouldMergeInto = !Number.isNaN(mergeIntoId);
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TCaver.findOne(mergeIntoId)
      .populate('exploredEntrances')
      .populate('groups')
      .populate('subscribedToCountries')
      .populate('subscribedToMassifs')
      .populate('grottos')
      .populate('documents');
    shouldMergeInto = !!mergeIntoEntity;
  }

  // eslint-disable-next-line no-inner-declarations
  async function reafectField(model, field, replacement = null) {
    if (shouldMergeInto) {
      await model.update({ [field]: caverId }).set({ [field]: mergeIntoId });
    } else {
      await model.update({ [field]: caverId }).set({ [field]: replacement });
    }
  }

  // eslint-disable-next-line no-inner-declarations
  async function removeAuthorAndReviewer(model) {
    await Promise.all([
      reafectField(model, 'author', DEFAULT_DELETED_CAVER_ID),
      reafectField(model, 'reviewer'),
    ]);
  }

  // eslint-disable-next-line no-inner-declarations
  async function linkedEntitiesDeleteOrMerge(key) {
    if (caver[key].length === 0) return;
    if (shouldMergeInto) {
      const existingEntities = mergeIntoEntity[key].map((e) => e.id);
      const entitiesToAdd = caver[key]
        .map((e) => e.id)
        .filter((e) => !existingEntities.includes(e));
      await TCaver.addToCollection(mergeIntoId, key, entitiesToAdd);
    }
    await TCaver.updateOne(caverId).set({ [key]: [] });
  }

  await Promise.all([
    removeAuthorAndReviewer(TGrotto),
    removeAuthorAndReviewer(TMassif),
    removeAuthorAndReviewer(TCave),
    removeAuthorAndReviewer(TEntrance),
    removeAuthorAndReviewer(TLocation),
    removeAuthorAndReviewer(TRigging),
    removeAuthorAndReviewer(TComment),
    removeAuthorAndReviewer(TDocument),
    reafectField(TDocument, 'validator'),
    removeAuthorAndReviewer(THistory),
    removeAuthorAndReviewer(TName),
    removeAuthorAndReviewer(TDescription),
    reafectField(TDocumentDuplicate, 'author', DEFAULT_DELETED_CAVER_ID),
    reafectField(TEntranceDuplicate, 'author', DEFAULT_DELETED_CAVER_ID),
  ]);

  await Promise.all([
    removeAuthorAndReviewer(HGrotto),
    removeAuthorAndReviewer(HMassif),
    removeAuthorAndReviewer(HCave),
    removeAuthorAndReviewer(HEntrance),
    removeAuthorAndReviewer(HLocation),
    removeAuthorAndReviewer(HRigging),
    removeAuthorAndReviewer(HComment),
    removeAuthorAndReviewer(HDocument),
    removeAuthorAndReviewer(HHistory),
    removeAuthorAndReviewer(HName),
    removeAuthorAndReviewer(HDescription),
  ]);

  if (shouldMergeInto) {
    await TNotification.update({ notified: caverId }).set({
      notified: mergeIntoId,
    });
    await TNotification.update({ notifier: caverId }).set({
      notifier: mergeIntoId,
    });
  } else {
    await TNotification.destroy({
      or: [{ notified: caverId }, { notifier: caverId }],
    });
  }

  if (shouldMergeInto) {
    await TLastChange.update({ author: caverId }).set({
      author: mergeIntoId,
    });
  } else {
    await TLastChange.destroy({ author: caverId });
  }

  await Promise.all([
    linkedEntitiesDeleteOrMerge('exploredEntrances'),
    linkedEntitiesDeleteOrMerge('groups'),
    linkedEntitiesDeleteOrMerge('subscribedToCountries'),
    linkedEntitiesDeleteOrMerge('subscribedToMassifs'),
    linkedEntitiesDeleteOrMerge('grottos'),
    linkedEntitiesDeleteOrMerge('documents'),
  ]);

  await TCaver.destroyOne({ id: caverId });

  await ElasticsearchService.deleteResource('cavers', caverId).catch(() => {});

  await NotificationService.notifySubscribers(
    req,
    caver,
    req.token.id,
    NotificationService.NOTIFICATION_TYPES.PERMANENT_DELETE,
    NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
  );

  return ControllerService.treatAndConvert(
    req,
    null,
    caver,
    { controllerMethod: 'CaverController.delete' },
    res,
    toCaver
  );
};
