const ControllerService = require('../../../services/ControllerService');
const RightService = require('../../../services/RightService');
const { toCaver } = require('../../../services/mapping/converters');
const CaverService = require('../../../services/CaverService');
const CommonService = require('../../../services/CommonService');
const DocumentService = require('../../../services/DocumentService');

const DEFAULT_DELETED_CAVER_ID = 8;

module.exports = async (req, res) => {
  const isModerator = RightService.hasGroup(
    req.token.groups,
    RightService.G.MODERATOR
  );
  const isAdministrator = RightService.hasGroup(
    req.token.groups,
    RightService.G.ADMINISTRATOR
  );

  const caverId = req.param('id');
  const caver = await CaverService.getCaver(caverId);
  if (!caver) {
    return res.notFound({ message: `Caver of id ${caverId} not found.` });
  }

  if (parseInt(caverId, 10) === DEFAULT_DELETED_CAVER_ID)
    return res.forbidden('You are not authorized to delete this caver.');
  if (caver.type === 'CAVER' && !isAdministrator)
    return res.forbidden('You are not authorized to delete a caver.');
  if (caver.type === 'AUTHOR' && !isModerator)
    return res.forbidden('You are not authorized to delete an author.');

  const mergeIntoId = parseInt(req.param('entityId'), 10);
  const shouldMergeInto = req.param('entityId') !== undefined;
  if (shouldMergeInto && Number.isNaN(mergeIntoId)) {
    return res.badRequest({
      message: `Invalid entityId: expected a numeric caver ID, got "${req.param('entityId')}".`,
    });
  }
  let mergeIntoEntity;
  if (shouldMergeInto) {
    mergeIntoEntity = await TCaver.findOne(mergeIntoId)
      .populate('exploredEntrances')
      .populate('groups')
      .populate('subscribedToCountries')
      .populate('subscribedToMassifs')
      .populate('subscribedToRegions')
      .populate('grottos')
      .populate('documents');
    if (!mergeIntoEntity) {
      return res.badRequest({
        message: `Merge target caver of id ${mergeIntoId} not found.`,
      });
    }
  }

  // toCaver renders documents as citations, which getCaver does not populate.
  // Enrich here, before the delete tears down the caver's associations, so the
  // response describes the caver as it was (same step as caver/find.js).
  caver.documents = await DocumentService.getDocumentsForCitation(
    caver.documents.map((d) => d.id)
  );

  // eslint-disable-next-line no-inner-declarations
  async function reassignField(model, field, replacement = null) {
    if (shouldMergeInto) {
      await model.update({ [field]: caverId }).set({ [field]: mergeIntoId });
    } else {
      await model.update({ [field]: caverId }).set({ [field]: replacement });
    }
  }

  // eslint-disable-next-line no-inner-declarations
  async function removeAuthorAndReviewer(model) {
    await Promise.all([
      reassignField(model, 'author', DEFAULT_DELETED_CAVER_ID),
      reassignField(model, 'reviewer'),
    ]);
  }

  // eslint-disable-next-line no-inner-declarations
  async function linkedEntitiesDeleteOrMerge(key, sourceIds = null) {
    if (shouldMergeInto) {
      const ids = sourceIds || (caver[key] || []).map((e) => e.id);
      if (ids.length > 0) {
        const existingIds = mergeIntoEntity[key].map((e) => e.id);
        const idsToAdd = ids.filter((id) => !existingIds.includes(id));
        if (idsToAdd.length > 0) {
          await TCaver.addToCollection(mergeIntoId, key, idsToAdd);
        }
      }
    }
    await TCaver.replaceCollection(caverId, key, []);
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
    reassignField(TDocument, 'validator'),
    removeAuthorAndReviewer(THistory),
    removeAuthorAndReviewer(TName),
    removeAuthorAndReviewer(TDescription),
    removeAuthorAndReviewer(TCrs),
    removeAuthorAndReviewer(TPoint),
    reassignField(TDocumentDuplicate, 'author', DEFAULT_DELETED_CAVER_ID),
    reassignField(TEntranceDuplicate, 'author', DEFAULT_DELETED_CAVER_ID),
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
    reassignField(HDocument, 'validator'),
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

  await TTokenBlacklist.destroy({ id_caver: caverId });

  // Documents are populated with a limit in getCaver, so we query
  // without limit to get the full set for merge.
  const allDocumentIds = shouldMergeInto
    ? (await TCaver.findOne(caverId).populate('documents')).documents.map(
        (d) => d.id
      )
    : null;

  await Promise.all([
    linkedEntitiesDeleteOrMerge('exploredEntrances'),
    linkedEntitiesDeleteOrMerge('groups'),
    linkedEntitiesDeleteOrMerge('subscribedToCountries'),
    linkedEntitiesDeleteOrMerge('subscribedToMassifs'),
    linkedEntitiesDeleteOrMerge('subscribedToRegions'),
    linkedEntitiesDeleteOrMerge('grottos'),
    linkedEntitiesDeleteOrMerge('documents', allDocumentIds),
    // Clean up legacy j_caver_cave_explorer rows (table preserved, no Waterline association)
    CommonService.query(
      'DELETE FROM j_caver_cave_explorer WHERE id_caver = $1',
      [caverId]
    ),
  ]);

  await TCaver.destroyOne({ id: caverId });

  const action = shouldMergeInto ? 'delete+merge' : 'delete';
  const audit = {
    action,
    caverId: parseInt(caverId, 10),
    caverType: caver.type,
    ...(shouldMergeInto && { mergeIntoId }),
    deletedBy: req.token.id,
  };
  sails.log.info(
    `Permanent ${action} caver ${caverId}: ${JSON.stringify(audit)}`
  );

  await CaverService.deleteInSearch(caverId);

  return ControllerService.treatAndConvert(
    req,
    null,
    caver,
    { controllerMethod: 'CaverController.delete' },
    res,
    toCaver
  );
};
