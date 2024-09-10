const ControllerService = require('../../../services/ControllerService');
const NameService = require('../../../services/NameService');
const NotificationService = require('../../../services/NotificationService');
const { toEntranceDuplicate } = require('../../../services/mapping/converters');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check if entrance exists
  const entranceId = req.param('id');
  const dbEntrance = await TEntrance.findOne(entranceId);
  if (!dbEntrance || dbEntrance.isDeleted) {
    return res.notFound({
      message: `Entrance of id ${entranceId} not found.`,
    });
  }

  const {
    entrance,
    newNames,
    newDescriptions,
    newLocations,
    newRiggings,
    newComments,
  } = req.body;

  const cleanedData = {
    ...entrance,
    id: entranceId,
  };

  const isArrNotEmpty = (value) => Array.isArray(value) && value.length > 0;

  if (isArrNotEmpty(newNames)) {
    const nameParams = newNames.map((name) => ({
      ...name,
      entrance: entranceId,
    }));
    const createdNames = await TName.createEach(nameParams).fetch();
    const createdNamesIds = createdNames.map((name) => name.id);
    cleanedData.names = [].concat(cleanedData.names, createdNamesIds);
  }

  if (isArrNotEmpty(newDescriptions)) {
    const descParams = newDescriptions.map((desc) => ({
      ...desc,
      entrance: entranceId,
    }));
    const createdDescriptions =
      await TDescription.createEach(descParams).fetch();
    const createdDescriptionsIds = createdDescriptions.map((desc) => desc.id);
    cleanedData.descriptions = [].concat(
      cleanedData.descriptions,
      createdDescriptionsIds
    );
  }

  if (isArrNotEmpty(newLocations)) {
    const locParams = newLocations.map((loc) => ({
      ...loc,
      entrance: entranceId,
    }));
    const createdLoc = await TLocation.createEach(locParams).fetch();
    const createdLocIds = createdLoc.map((loc) => loc.id);
    cleanedData.locations = [].concat(cleanedData.locations, createdLocIds);
  }

  if (isArrNotEmpty(newRiggings)) {
    const riggingParams = newRiggings.map((rig) => ({
      ...rig,
      entrance: entranceId,
    }));
    const createdRiggings = await TRigging(riggingParams).fetch();
    const createdRiggingsIds = createdRiggings.map((rig) => rig.id);
    cleanedData.riggings = [].concat(cleanedData.riggings, createdRiggingsIds);
  }

  if (isArrNotEmpty(newComments)) {
    const commentParams = newComments.map((comment) => ({
      ...comment,
      entrance: entranceId,
    }));
    const createdComments = await TComment.createEach(commentParams).fetch();
    const createdCommentIds = createdComments.map((comment) => comment.id);
    cleanedData.comments = [].concat(cleanedData.comments, createdCommentIds);
  }

  await sails.getDatastore().transaction(async (db) => {
    const updatedEntrance = await TEntrance.updateOne({
      id: entranceId,
    })
      .set(cleanedData)
      .usingConnection(db);

    await NameService.setNames([updatedEntrance], 'entrance');

    await NotificationService.notifySubscribers(
      req,
      updatedEntrance,
      req.token.id,
      NotificationService.NOTIFICATION_TYPES.UPDATE,
      NotificationService.NOTIFICATION_ENTITIES.ENTRANCE
    );

    return ControllerService.treatAndConvert(
      req,
      null,
      updatedEntrance,
      { controllerMethod: 'EntranceController.update' },
      res,
      toEntranceDuplicate
    );
  });
};
