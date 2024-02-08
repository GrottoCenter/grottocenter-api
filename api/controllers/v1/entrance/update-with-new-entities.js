const ramda = require('ramda');
const ControllerService = require('../../../services/ControllerService');
const ErrorService = require('../../../services/ErrorService');
const NameService = require('../../../services/NameService');
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITIES,
} = require('../../../services/NotificationService');
const NotificationService = require('../../../services/NotificationService');
const { toEntranceDuplicate } = require('../../../services/mapping/converters');

// eslint-disable-next-line consistent-return
module.exports = async (req, res) => {
  // Check if entrance exists
  const entranceId = req.param('id');
  const currentEntrance = await TEntrance.findOne(entranceId);
  if (!currentEntrance) {
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

  const checkForEmptiness = (value) => value && !ramda.isEmpty(value);

  try {
    if (checkForEmptiness(newNames)) {
      const nameParams = newNames.map((name) => ({
        ...name,
        entrance: entranceId,
      }));
      const createdNames = await TName.createEach(nameParams).fetch();
      const createdNamesIds = createdNames.map((name) => name.id);
      cleanedData.names = ramda.concat(cleanedData.names, createdNamesIds);
    }

    if (checkForEmptiness(newDescriptions)) {
      const descParams = newDescriptions.map((desc) => ({
        ...desc,
        entrance: entranceId,
      }));
      const createdDescriptions =
        await TDescription.createEach(descParams).fetch();
      const createdDescriptionsIds = createdDescriptions.map((desc) => desc.id);
      cleanedData.descriptions = ramda.concat(
        cleanedData.descriptions,
        createdDescriptionsIds
      );
    }

    if (checkForEmptiness(newLocations)) {
      const locParams = newLocations.map((loc) => ({
        ...loc,
        entrance: entranceId,
      }));
      const createdLoc = await TLocation.createEach(locParams).fetch();
      const createdLocIds = createdLoc.map((loc) => loc.id);
      cleanedData.locations = ramda.concat(
        cleanedData.locations,
        createdLocIds
      );
    }

    if (checkForEmptiness(newRiggings)) {
      const riggingParams = newRiggings.map((rig) => ({
        ...rig,
        entrance: entranceId,
      }));
      const createdRiggings = await TRigging(riggingParams).fetch();
      const createdRiggingsIds = createdRiggings.map((rig) => rig.id);
      cleanedData.riggings = ramda.concat(
        cleanedData.riggings,
        createdRiggingsIds
      );
    }

    if (checkForEmptiness(newComments)) {
      const commentParams = newComments.map((comment) => ({
        ...comment,
        entrance: entranceId,
      }));
      const createdComments = await TComment.createEach(commentParams).fetch();
      const createdCommentIds = createdComments.map((comment) => comment.id);
      cleanedData.comments = ramda.concat(
        cleanedData.comments,
        createdCommentIds
      );
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
        NOTIFICATION_TYPES.UPDATE,
        NOTIFICATION_ENTITIES.ENTRANCE
      );

      const params = {};
      params.controllerMethod = 'EntranceController.update';
      return ControllerService.treatAndConvert(
        req,
        null,
        updatedEntrance,
        params,
        res,
        toEntranceDuplicate
      );
    });
  } catch (e) {
    return ErrorService.getDefaultErrorHandler(res)(e);
  }
};
