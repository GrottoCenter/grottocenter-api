const CaveService = require('./CaveService');
const DocumentService = require('./DocumentService');
const NameService = require('./NameService');

const NOTIFICATION_ENTITIES = {
  CAVE: 'cave',
  COMMENT: 'comment',
  DESCRIPTION: 'description',
  DOCUMENT: 'document',
  ENTRANCE: 'entrance',
  HISTORY: 'history',
  LOCATION: 'location',
  MASSIF: 'massif',
  ORGANIZATION: 'organization',
  RIGGING: 'rigging',
};

const NOTIFICATION_TYPES = {
  CREATE: 'CREATE',
  DELETE: 'DELETE',
  UPDATE: 'UPDATE',
  VALIDATE: 'VALIDATE',
};

const safeGetPropId = (prop, data) => {
  if (data[prop]) {
    if (data[prop] instanceof Object) {
      return data[prop].id;
    }
    return data[prop];
  }
  return undefined;
};

const sendNotificationEmail = async (
  entity,
  notificationType,
  notificationEntity,
  req,
  user
) => {
  // Get entity name (handle all cases)
  let entityName = '';
  if (entity.name) entityName = entity.name;
  else if (entity.names) entityName = entity.names[0]?.name;
  else if (entity.title) entityName = entity.title;
  else if (entity.titles) entityName = entity.titles[0]?.text;
  else if (entity.body) entityName = `${entity.body.slice(0, 50)}...`;
  else if (entity.descriptions) entityName = entity.descriptions[0].title;

  // Format action verb
  let actionVerb = '';
  switch (notificationType) {
    case NOTIFICATION_TYPES.CREATE:
      actionVerb = 'created';
      break;

    case NOTIFICATION_TYPES.DELETE:
      actionVerb = 'deleted';
      break;

    case NOTIFICATION_TYPES.UPDATE:
      actionVerb = 'updated';
      break;

    case NOTIFICATION_TYPES.VALIDATE:
      actionVerb = 'validated';
      break;

    default:
      throw Error(`Unknown notification type: ${notificationType}`);
  }

  // Format entity Link
  let entityLink = `${sails.config.custom.baseUrl}/ui/`;
  const relatedCaveId = safeGetPropId('cave', entity);
  const relatedEntranceId = safeGetPropId('entrance', entity);
  const relatedMassifId = safeGetPropId('massif', entity);

  switch (notificationEntity) {
    case NOTIFICATION_ENTITIES.CAVE:
      entityLink += `caves/${entity.id}`;
      break;

    case NOTIFICATION_ENTITIES.COMMENT:
    case NOTIFICATION_ENTITIES.HISTORY:
    case NOTIFICATION_ENTITIES.RIGGING:
      if (relatedCaveId) entityLink += `caves/${relatedCaveId}`;
      else if (relatedEntranceId)
        entityLink += `entrances/${relatedEntranceId}`;
      else
        throw Error(
          `Can't find related entity (cave or entrance) of the
          ${notificationType === NOTIFICATION_ENTITIES.COMMENT && 'comment'}
          ${notificationType === NOTIFICATION_ENTITIES.HISTORY && 'history'}
          ${
            notificationType === NOTIFICATION_ENTITIES.RIGGING && 'rigging'
          } with id ${entity.id}`
        );
      break;

    case NOTIFICATION_ENTITIES.DESCRIPTION:
      if (relatedCaveId) entityLink += `caves/${relatedCaveId}`;
      else if (relatedEntranceId)
        entityLink += `entrances/${relatedEntranceId}`;
      else if (relatedMassifId) entityLink += `massifs/${relatedMassifId}`;
      else
        throw Error(
          `Cant find related entity (cave, entrance or massif) of the description with id ${entity.id}`
        );
      break;

    case NOTIFICATION_ENTITIES.DOCUMENT:
      entityLink += `documents/${entity.id}`;
      break;

    case NOTIFICATION_ENTITIES.ENTRANCE:
      entityLink += `entrances/${entity.id}`;
      break;

    case NOTIFICATION_ENTITIES.LOCATION:
      if (relatedEntranceId) entityLink += `entrances/${relatedEntranceId}`;
      else
        throw Error(
          `Cant find related entity (entrance) of the location with id ${entity.id}`
        );
      break;

    case NOTIFICATION_ENTITIES.MASSIF:
      entityLink += `massifs/${entity.id}`;
      break;

    case NOTIFICATION_ENTITIES.ORGANIZATION:
      entityLink += `organizations/${entity.id}`;
      break;

    default:
      throw Error(`Unknown notification entity: ${notificationEntity}`);
  }

  await sails.helpers.sendEmail
    .with({
      allowResponse: false,
      emailSubject: 'Notification',
      i18n: req.i18n,
      recipientEmail: user.mail,
      viewName: 'notification',
      viewValues: {
        actionVerb,
        entityLink,
        entityName,
        entityType: notificationEntity,
        recipientName: user.nickname,
        subscriptionName: user.subscriptionName,
        subscriptionType: user.subscriptionType,
      },
    })
    .intercept('sendSESEmailError', () => {
      sails.log.error(
        `The email service has encountered an error while trying to notify user ${user.nickname} (id=${user.id}).`
      );
      return false;
    });
};

const getCountryAndMassifSubscribers = async (
  entityCountryId,
  entityMassifIds
) => {
  const countrySubscribers = [];
  const massifsSubscribers = [];
  if (entityCountryId) {
    const country = await TCountry.findOne(entityCountryId).populate(
      'subscribedCavers'
    );
    countrySubscribers.push(
      ...country.subscribedCavers.map((caver) => ({
        ...caver,
        subscriptionName: country.nativeName,
        subscriptionType: 'country',
      }))
    );
  }
  if (entityMassifIds) {
    await Promise.all(
      entityMassifIds.map(async (massifId) => {
        const massif = await TMassif.findOne(massifId).populate(
          'subscribedCavers'
        );
        await NameService.setNames([massif], 'massif');
        massifsSubscribers.push(
          ...massif.subscribedCavers.map((caver) => ({
            ...caver,
            subscriptionType: 'massif',
            subscriptionName: massif.names[0]?.name,
          }))
        );
      })
    );
  }
  return { countrySubscribers, massifsSubscribers };
};

module.exports = {
  NOTIFICATION_ENTITIES,
  NOTIFICATION_TYPES,
  ...(process.env.NODE_ENV === 'test' ? { sendNotificationEmail } : undefined),

  /**
   *
   * @param {*} req
   * @param {*} entity
   * @param {Number} notifierId
   * @param {NOTIFICATION_TYPES} notificationType
   * @param {NOTIFICATION_ENTITIES} notificationEntity
   * @return {Boolean} true if everything went well, else false
   */
  notifySubscribers: async (
    req,
    entity,
    notifierId,
    notificationType,
    notificationEntity
  ) => {
    // Check params and silently fail to avoid sending an error to the client
    if (!Object.values(NOTIFICATION_ENTITIES).includes(notificationEntity)) {
      throw new Error(`Invalid notification entity: ${notificationEntity}`);
    }
    if (!Object.values(NOTIFICATION_TYPES).includes(notificationType)) {
      throw new Error(`Invalid notification type: ${notificationType}`);
    }
    if (!notifierId) {
      throw new Error(`Missing notifier id`);
    }

    try {
      // Find massif nor country concerned about the notification
      let entityMassifIds = [];
      let entityCountryId;

      // Find concerned country or massifs
      const caveId = safeGetPropId('cave', entity);
      const entranceId = safeGetPropId('entrance', entity);
      const massifId = safeGetPropId('massif', entity);
      switch (notificationEntity) {
        case NOTIFICATION_ENTITIES.CAVE: {
          entityCountryId = safeGetPropId('country', entity?.entrances[0]); // Get country from first entrance (not perfect but good enough)
          entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
            (m) => m.id
          );
          break;
        }

        case NOTIFICATION_ENTITIES.COMMENT: {
          if (caveId) {
            entityCountryId = safeGetPropId(
              'country',
              entity?.cave.entrances[0]
            ); // Get country from first entrance (not perfect but good enough)
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (entranceId) {
            entityCountryId = safeGetPropId('country', entity?.entrance);
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else {
            throw new Error(`Can't retrieve related cave or entrance id.`);
          }
          break;
        }

        case NOTIFICATION_ENTITIES.DESCRIPTION: {
          if (caveId) {
            entityCountryId = safeGetPropId(
              'country',
              entity?.cave.entrances[0]
            ); // Get country from first entrance (not perfect but good enough)
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (entranceId) {
            entityCountryId = safeGetPropId('country', entity?.entrance);
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (massifId) {
            entityMassifIds = [entity.massif];
          } else {
            throw new Error(
              `Can't retrieve related cave, entrance or massif id.`
            );
          }
          break;
        }
        case NOTIFICATION_ENTITIES.DOCUMENT: {
          if (caveId) {
            entityCountryId = safeGetPropId(
              'country',
              entity?.cave.entrances[0]
            ); // Get country from first entrance (not perfect but good enough)
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (entranceId) {
            entityCountryId = safeGetPropId('country', entity?.entrance);
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (massifId) {
            entityMassifIds = [safeGetPropId('massif', entity)];
          } else {
            throw new Error(
              `Can't retrieve related cave, entrance or massif id.`
            );
          }
          break;
        }
        case NOTIFICATION_ENTITIES.ENTRANCE:
          entityCountryId = safeGetPropId('country', entity);
          if (entity?.cave?.id) {
            entityMassifIds = await CaveService.getMassifs(entity.cave.id);
          }
          break;
        case NOTIFICATION_ENTITIES.HISTORY: {
          if (caveId) {
            entityCountryId = safeGetPropId(
              'country',
              entity?.cave.entrances[0]
            ); // Get country from first entrance (not perfect but good enough)
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (entranceId) {
            entityCountryId = safeGetPropId('country', entity?.entrance);
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else {
            throw new Error(`Can't retrieve related cave or entrance id.`);
          }
          break;
        }
        case NOTIFICATION_ENTITIES.LOCATION: {
          if (entranceId) {
            entityCountryId = safeGetPropId('country', entity?.entrance);
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else {
            throw new Error(`Can't retrieve related entrance id.`);
          }
          break;
        }
        case NOTIFICATION_ENTITIES.MASSIF:
          entityMassifIds = [entity.id];
          break;
        case NOTIFICATION_ENTITIES.ORGANIZATION:
          entityCountryId = safeGetPropId('country', entity);
          break;

        case NOTIFICATION_ENTITIES.RIGGING: {
          if (caveId) {
            entityCountryId = safeGetPropId(
              'country',
              entity?.cave.entrances[0]
            ); // Get country from first entrance (not perfect but good enough)
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else if (entranceId) {
            entityCountryId = safeGetPropId('country', entity?.entrance);
            entityMassifIds = (await CaveService.getMassifs(entity.id)).map(
              (m) => m.id
            );
          } else {
            throw new Error(`Can't retrieve related cave or entrance id.`);
          }
          break;
        }
        default:
          throw new Error(
            `Can't find what to do with the following notification entity value: ${notificationEntity}`
          );
      }

      // Find subscribers to the entity.
      const { countrySubscribers, massifsSubscribers } =
        await getCountryAndMassifSubscribers(entityCountryId, entityMassifIds);
      // List users who will receive the notification
      const uniqueUsers = Array.from(
        new Set([
          // Don't notify the notifierId
          ...countrySubscribers.filter((u) => u.id !== notifierId),
          ...massifsSubscribers.filter((u) => u.id !== notifierId),
        ])
      );

      // Format notification
      const notification = await module.exports.populateEntities({
        dateInscription: new Date(),
        notificationType: (
          await TNotificationType.findOne({
            name: notificationType,
          })
        ).id,
        notifier: notifierId,
        // For the populateEntities() method, must use "grotto" instead of "organization"
        [notificationEntity === NOTIFICATION_ENTITIES.ORGANIZATION
          ? 'grotto'
          : notificationEntity]: entity,
      });

      // Create notifications & optionally send email
      const res = await Promise.all(
        uniqueUsers.map(async (user) => {
          try {
            await TNotification.create({
              ...notification,
              notified: user.id,
              // For the DB, must use "grotto" instead of "organization"
              [notificationEntity === NOTIFICATION_ENTITIES.ORGANIZATION
                ? 'grotto'
                : notificationEntity]: entity.id, // id only for the DB storage
            });
          } catch (e) {
            sails.log.error(
              `An error occured when trying to create a notification: ${e.message}`
            );
            return false;
          }

          if (user.sendNotificationByEmail) {
            await sendNotificationEmail(
              entity,
              notificationType,
              notificationEntity,
              req,
              user
            );
          }
          return true;
        })
      );
      return res;
    } catch (error) {
      // Fail silently to avoid sending an error to the user
      sails.log.error(
        `An error occurred when trying to notify subscribers: ${error.message} ${error.stack}`
      );
      return false;
    }
  },

  populateEntities: async (notification) => {
    const populatedNotification = notification;
    if (populatedNotification.cave) {
      await NameService.setNames([populatedNotification.cave], 'cave');
    }
    if (populatedNotification.comment) {
      populatedNotification.comment = await TComment.findOne(
        safeGetPropId('comment', notification)
      )
        .populate('cave')
        .populate('entrance');
    }
    if (populatedNotification.description) {
      populatedNotification.description = await TDescription.findOne(
        safeGetPropId('description', notification)
      )
        .populate('cave')
        .populate('document')
        .populate('entrance')
        .populate('massif');
    }
    if (populatedNotification.document) {
      // Had to require in the function to avoid a circular dependency with notifySubscribers() in DocumentService.createDocument()
      // eslint-disable-next-line global-require
      const DocumentService = require('./DocumentService');
      populatedNotification.document = await DocumentService.getDocument(
        safeGetPropId('document', notification)
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
        safeGetPropId('history', notification)
      )
        .populate('cave')
        .populate('entrance');
    }
    if (populatedNotification.location) {
      populatedNotification.location = await TLocation.findOne(
        safeGetPropId('location', notification)
      ).populate('entrance');
    }
    if (populatedNotification.massif) {
      await NameService.setNames([populatedNotification.massif], 'massif');
    }
    if (populatedNotification.rigging) {
      populatedNotification.rigging = await TRigging.findOne(
        safeGetPropId('rigging', notification)
      )
        .populate('entrance')
        .populate('cave');
    }
    return populatedNotification;
  },
};
