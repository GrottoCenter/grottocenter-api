const DocumentService = require('./DocumentService');
const NameService = require('./NameService');

module.exports = {
  populateEntities: async (notification) => {
    const populatedNotification = notification;
    if (populatedNotification.cave) {
      await NameService.setNames([populatedNotification.cave], 'cave');
    }
    if (populatedNotification.comment) {
      populatedNotification.comment = await TComment.findOne(
        notification.comment.id
      )
        .populate('cave')
        .populate('entrance');
    }
    if (populatedNotification.description) {
      populatedNotification.description = await TDescription.findOne(
        notification.description.id
      )
        .populate('cave')
        .populate('document')
        .populate('entrance')
        .populate('massif');
    }
    if (populatedNotification.document) {
      populatedNotification.document = await DocumentService.getDocument(
        populatedNotification.document.id
      );
    }
    if (populatedNotification.entrance) {
      await NameService.setNames([populatedNotification.entrance], 'entrance');
    }
    if (populatedNotification.grotto) {
      await NameService.setNames([populatedNotification.grotto], 'grotto');
    }
    if (populatedNotification.history) {
      populatedNotification.history = await THistory.findOne(
        notification.history.id
      )
        .populate('cave')
        .populate('entrance');
    }
    if (populatedNotification.location) {
      populatedNotification.location = await TLocation.findOne(
        notification.location.id
      ).populate('entrance');
    }
    if (populatedNotification.massif) {
      await NameService.setNames([populatedNotification.massif], 'massif');
    }
    if (populatedNotification.rigging) {
      populatedNotification.rigging = await TRigging.findOne(
        notification.rigging.id
      )
        .populate('entrance')
        .populate('cave');
    }
    return populatedNotification;
  },
};
