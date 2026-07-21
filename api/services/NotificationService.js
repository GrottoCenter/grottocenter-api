const NameService = require('./NameService');
const CommonService = require('./CommonService');
const LanguageService = require('./LanguageService');

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
  IMPORT_COMPLETE: 'IMPORT_COMPLETE',
  PERMANENT_DELETE: 'PERMANENT_DELETE',
  UPDATE: 'UPDATE',
  VALIDATE: 'VALIDATE',
  RESTORE: 'RESTORE',
  REJECT: 'REJECT',
};

async function removeOlderNotifications() {
  const query = `DELETE
                 FROM t_notification
                 WHERE date_inscription < current_timestamp - interval '2 month';`;
  await CommonService.query(query);
}

const safeGetPropId = (prop, data) => {
  if (data && data[prop]) {
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
  user
) => {
  // Resolve the recipient's preferred locale
  const locale =
    (await LanguageService.getLocale(user.language)) ||
    sails.config.i18n.defaultLocale;

  // Get entity name (handle all cases)
  const getEntityName = (entityData) => {
    if (entityData.name) return entityData.name;
    if (entityData.names) return entityData.names[0]?.name;
    if (entityData.title) return entityData.title;
    if (entityData.titles) return entityData.titles[0]?.text;
    if (entityData.body) return `${entityData.body.slice(0, 50)}...`;
    if (entityData.descriptions) return entityData.descriptions[0].title;
    return '';
  };

  const entityName = getEntityName(entity);

  // Format action verb
  const actionVerbMap = {
    [NOTIFICATION_TYPES.CREATE]: 'created',
    [NOTIFICATION_TYPES.DELETE]: 'deleted',
    [NOTIFICATION_TYPES.IMPORT_COMPLETE]: 'completed',
    [NOTIFICATION_TYPES.PERMANENT_DELETE]: 'permanently deleted',
    [NOTIFICATION_TYPES.UPDATE]: 'updated',
    [NOTIFICATION_TYPES.VALIDATE]: 'validated',
    [NOTIFICATION_TYPES.RESTORE]: 'restored',
    [NOTIFICATION_TYPES.REJECT]: 'rejected',
  };

  const actionVerb = actionVerbMap[notificationType];
  if (!actionVerb) {
    throw Error(`Unknown notification type: ${notificationType}`);
  }

  // Format entity Link
  const baseUrl = `${sails.config.custom.baseUrl}/ui/`;
  const relatedCaveId = safeGetPropId('cave', entity);
  const relatedEntranceId = safeGetPropId('entrance', entity);
  const relatedMassifId = safeGetPropId('massif', entity);

  const getRelatedEntityLink = () => {
    if (relatedCaveId) return `caves/${relatedCaveId}`;
    if (relatedEntranceId) return `entrances/${relatedEntranceId}`;
    if (relatedMassifId) return `massifs/${relatedMassifId}`;
    return null;
  };

  const directLinkEntities = {
    [NOTIFICATION_ENTITIES.CAVE]: `caves/${entity.id}`,
    [NOTIFICATION_ENTITIES.DOCUMENT]: `documents/${entity.id}`,
    [NOTIFICATION_ENTITIES.ENTRANCE]: `entrances/${entity.id}`,
    [NOTIFICATION_ENTITIES.MASSIF]: `massifs/${entity.id}`,
    [NOTIFICATION_ENTITIES.ORGANIZATION]: `organizations/${entity.id}`,
  };

  let entityLink;
  if (directLinkEntities[notificationEntity]) {
    entityLink = baseUrl + directLinkEntities[notificationEntity];
  } else {
    const relatedLink = getRelatedEntityLink();
    if (!relatedLink) {
      const entityTypeName = notificationEntity.toLowerCase();
      let requiredEntities;
      if (notificationEntity === NOTIFICATION_ENTITIES.DESCRIPTION) {
        requiredEntities = 'cave, entrance or massif';
      } else if (notificationEntity === NOTIFICATION_ENTITIES.LOCATION) {
        requiredEntities = 'entrance';
      } else {
        requiredEntities = 'cave or entrance';
      }
      throw Error(
        `Can't find related entity (${requiredEntities}) of the ${entityTypeName} with id ${entity.id}`
      );
    }
    entityLink = baseUrl + relatedLink;
  }

  await sails.helpers.sendEmail
    .with({
      allowResponse: false,
      emailSubject: 'Notification',
      locale,
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
        isAuthorNotification: user.isAuthorNotification || false,
        validationComment: user.validationComment || null,
      },
    })
    .intercept('sendSESEmailError', () => {
      sails.log.error(
        `The email service has encountered an error while trying to notify user ${user.nickname} (id=${user.id}).`
      );
      return false;
    });
};

const getCountryMassifAndRegionSubscribers = async (
  entityCountryId,
  entityMassifIds,
  entityRegionId
) => {
  const countrySubscribers = [];
  const massifsSubscribers = [];
  const regionSubscribers = [];
  if (entityCountryId) {
    const country =
      await TCountry.findOne(entityCountryId).populate('subscribedCavers');
    if (country) {
      countrySubscribers.push(
        ...country.subscribedCavers.map((caver) => ({
          ...caver,
          subscriptionName: country.nativeName,
          subscriptionType: 'country',
        }))
      );
    }
  }
  if (entityMassifIds) {
    await Promise.all(
      entityMassifIds.map(async (massifId) => {
        const massif =
          await TMassif.findOne(massifId).populate('subscribedCavers');
        if (massif) {
          await NameService.setNames([massif], 'massif');
          massifsSubscribers.push(
            ...massif.subscribedCavers.map((caver) => ({
              ...caver,
              subscriptionType: 'massif',
              subscriptionName: massif.names[0]?.name,
            }))
          );
        }
      })
    );
  }
  if (entityRegionId) {
    const region =
      await TISO31662.findOne(entityRegionId).populate('subscribedCavers');
    if (region) {
      regionSubscribers.push(
        ...region.subscribedCavers.map((caver) => ({
          ...caver,
          subscriptionName: region.name,
          subscriptionType: 'region',
        }))
      );
    }
  }
  return { countrySubscribers, massifsSubscribers, regionSubscribers };
};

module.exports = {
  NOTIFICATION_ENTITIES,
  notifyMessageRecipient: async (senderId, conversationId) => {
    try {
      const sender = await TCaver.findOne({ id: senderId });
      if (!sender) return;
      const query = `SELECT id_caver FROM j_participant WHERE id_conversation = $1 AND id_caver != $2`;
      const result = await CommonService.query(query, [
        conversationId,
        senderId,
      ]);
      if (result.rows.length === 0) return;
      const row = result.rows[0];
      const recipient = await TCaver.findOne({ id: row.id_caver });
      if (!recipient || !recipient.sendMessageNotificationByEmail) return;
      const locale =
        (await LanguageService.getLocale(recipient.language)) ||
        sails.config.i18n.defaultLocale;
      const conversationLink = `${sails.config.custom.baseUrl}/ui/messages/${conversationId}`;
      await sails.helpers.sendEmail
        .with({
          allowResponse: false,
          emailSubject: 'New Message',
          locale,
          recipientEmail: recipient.mail,
          viewName: 'new-message',
          viewValues: {
            senderNickname: sender.nickname,
            conversationLink,
            recipientName: recipient.nickname,
          },
        })
        .intercept('sendSESEmailError', () => {
          sails.log.error(
            `The email service error notifying user ${recipient.nickname}.`
          );
          return false;
        });
    } catch (error) {
      sails.log.error(
        `An error occurred in notifyMessageRecipient: ${error.message}`
      );
    }
  },
  NOTIFICATION_TYPES,
  ...(process.env.NODE_ENV === 'test' ? { sendNotificationEmail } : undefined),

  /**
   *
   * @param {*} entity
   * @param {Number} notifierId
   * @param {NOTIFICATION_TYPES} notificationType
   * @param {NOTIFICATION_ENTITIES} notificationEntity
   * @return {Boolean} true if everything went well, else false
   */
  notifySubscribers: async (
    entity,
    notifierId,
    notificationType,
    notificationEntity
  ) => {
    // Had to require in the function to avoid a circular dependency with notifySubscribers() in CaveService.createCave()
    // eslint-disable-next-line global-require
    const CaveService = require('./CaveService');

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
      // For the populateEntities() method, must use "grotto" instead of "organization"
      const entityKey =
        notificationEntity === NOTIFICATION_ENTITIES.ORGANIZATION
          ? 'grotto'
          : notificationEntity;

      // Format notification and populate entity
      const notification = await module.exports.populateEntities({
        dateInscription: new Date(),
        notificationType: (
          await TNotificationType.findOne({
            name: notificationType,
          })
        ).id,
        notifier: notifierId,
        [entityKey]: entity,
      });

      const populatedEntity = notification[entityKey];

      const caveId = safeGetPropId('cave', populatedEntity);
      const entranceId = safeGetPropId('entrance', populatedEntity);
      const massifId = safeGetPropId('massif', populatedEntity);

      const getMassifIdsFromCave = async (id) =>
        (await CaveService.getMassifs(id)).map((m) => m.id);
      const getCountryId = (id) => safeGetPropId('country', id);
      const getRegionId = (entityData) => entityData?.iso_3166_2;

      const getCountryFromCaveEntrances = (cave) => {
        if (cave?.entrances?.length > 0) {
          return getCountryId(cave.entrances[0]);
        }
        return null;
      };

      const resolveLocationFromCaveOrEntrance = async (
        relatedCaveId,
        relatedEntranceId,
        entityData
      ) => {
        if (relatedCaveId) {
          return {
            countryId: getCountryFromCaveEntrances(entityData.cave),
            massifIds: await getMassifIdsFromCave(relatedCaveId),
            regionId: entityData.cave?.entrances?.[0]
              ? getRegionId(entityData.cave.entrances[0])
              : null,
          };
        }
        if (relatedEntranceId) {
          return {
            countryId: getCountryId(entityData.entrance),
            massifIds: await getMassifIdsFromCave(
              safeGetPropId('cave', entityData.entrance)
            ),
            regionId: getRegionId(entityData.entrance),
          };
        }
        return { countryId: null, massifIds: [], regionId: null };
      };

      // Entity-specific location resolution
      const entityResolvers = {
        [NOTIFICATION_ENTITIES.CAVE]: async () => ({
          countryId: getCountryFromCaveEntrances(populatedEntity),
          massifIds: await getMassifIdsFromCave(populatedEntity.id),
          regionId: populatedEntity?.entrances?.[0]
            ? getRegionId(populatedEntity.entrances[0])
            : null,
        }),

        [NOTIFICATION_ENTITIES.ENTRANCE]: async () => ({
          countryId: getCountryId(populatedEntity),
          massifIds: populatedEntity?.cave
            ? await getMassifIdsFromCave(safeGetPropId('cave', populatedEntity))
            : [],
          regionId: getRegionId(populatedEntity),
        }),

        [NOTIFICATION_ENTITIES.MASSIF]: async () => ({
          countryId: null,
          massifIds: [populatedEntity.id],
          regionId: null,
        }),

        [NOTIFICATION_ENTITIES.ORGANIZATION]: async () => ({
          countryId: getCountryId(populatedEntity),
          massifIds: [],
          regionId: getRegionId(populatedEntity),
        }),

        [NOTIFICATION_ENTITIES.LOCATION]: async () => {
          if (!entranceId)
            throw new Error(`Can't retrieve related entrance id.`);
          return {
            countryId: getCountryId(populatedEntity.entrance),
            massifIds: await getMassifIdsFromCave(
              safeGetPropId('cave', populatedEntity.entrance)
            ),
            regionId: getRegionId(populatedEntity.entrance),
          };
        },
      };

      // Entities that can relate to cave, entrance, or massif
      const multiRelationEntities = [
        NOTIFICATION_ENTITIES.COMMENT,
        NOTIFICATION_ENTITIES.DESCRIPTION,
        NOTIFICATION_ENTITIES.HISTORY,
        NOTIFICATION_ENTITIES.RIGGING,
      ];

      // Find massifs and country concerned about the notification
      let result;
      if (entityResolvers[notificationEntity]) {
        result = await entityResolvers[notificationEntity]();
      } else if (multiRelationEntities.includes(notificationEntity)) {
        result = await resolveLocationFromCaveOrEntrance(
          caveId,
          entranceId,
          populatedEntity
        );

        // Handle massif-only case for description and document
        if (!result.countryId && !result.massifIds.length && massifId) {
          result.massifIds = [safeGetPropId('massif', populatedEntity)];
        }

        // Require cave or entrance for most entities
        if (
          !caveId &&
          !entranceId &&
          ![
            NOTIFICATION_ENTITIES.DESCRIPTION,
            NOTIFICATION_ENTITIES.DOCUMENT,
          ].includes(notificationEntity)
        ) {
          throw new Error(`Can't retrieve related cave or entrance id.`);
        }
      } else if (notificationEntity === NOTIFICATION_ENTITIES.DOCUMENT) {
        result = await resolveLocationFromCaveOrEntrance(
          caveId,
          entranceId,
          populatedEntity
        );
        if (!result.countryId && !result.massifIds.length && massifId) {
          result.massifIds = [safeGetPropId('massif', populatedEntity)];
        }
      } else {
        throw new Error(
          `Can't find what to do with the following notification entity value: ${notificationEntity}`
        );
      }

      const entityCountryId = result.countryId;
      const entityMassifIds = result.massifIds;
      const entityRegionId = result.regionId;

      // Find subscribers to the entity.
      const { countrySubscribers, massifsSubscribers, regionSubscribers } =
        await getCountryMassifAndRegionSubscribers(
          entityCountryId,
          entityMassifIds,
          entityRegionId
        );
      // Consolidate subscribers by user ID and combine subscription types
      const subscriberMap = new Map();

      const addSubscribers = (subscribers) => {
        subscribers
          .filter((u) => u.id !== notifierId)
          .forEach((user) => {
            if (subscriberMap.has(user.id)) {
              const existing = subscriberMap.get(user.id);
              existing.subscriptionNames.push(user.subscriptionName);
              existing.subscriptionTypes.push(user.subscriptionType);
            } else {
              subscriberMap.set(user.id, {
                ...user,
                subscriptionNames: [user.subscriptionName],
                subscriptionTypes: [user.subscriptionType],
              });
            }
          });
      };

      addSubscribers(countrySubscribers);
      addSubscribers(massifsSubscribers);
      addSubscribers(regionSubscribers);

      const uniqueUsers = Array.from(subscriberMap.values()).map((user) => ({
        ...user,
        subscriptionName: user.subscriptionNames.join(' and '),
        subscriptionType: user.subscriptionTypes.join(', '),
      }));

      // Create notifications & optionally send email
      const res = await Promise.all(
        uniqueUsers.map(async (user) => {
          try {
            await TNotification.create({
              ...notification,
              notified: user.id,
              [entityKey]: notification[entityKey].id, // id only for the DB storage
            });
          } catch (e) {
            sails.log.error(
              `An error occured when trying to create a notification: ${e.message}`
            );
            return false;
          }

          if (user.sendNotificationByEmail) {
            await sendNotificationEmail(
              populatedEntity,
              notificationType,
              notificationEntity,
              user
            );
          }
          return true;
        })
      );

      // 5% chance to also remove older notifications
      if (process.env.NODE_ENV !== 'test' && Math.random() < 0.05) {
        try {
          await removeOlderNotifications();
        } catch (cleanupError) {
          sails.log.error(
            `Error during notification cleanup: ${cleanupError.message}`
          );
        }
      }

      return res;
    } catch (error) {
      // Fail silently to avoid sending an error to the user
      sails.log.error(
        `An error occurred when trying to notify subscribers: ${error.message} ${error.stack}`
      );
      return false;
    }
  },

  /**
   * Create an in-app notification for the document author and optionally send an email.
   *
   * @param {Object}  document         - Populated TDocument (must have .author)
   * @param {Number}  moderatorId      - ID of the moderator who made the decision
   * @param {String}  notificationType - NOTIFICATION_TYPES.VALIDATE or NOTIFICATION_TYPES.REJECT
   * @param {String|null} validationComment - Moderator's comment (required for REJECT)
   * @returns {Boolean} true on success, false on silent failure
   */
  notifyAuthor: async (
    document,
    moderatorId,
    notificationType,
    validationComment
  ) => {
    const authorId = safeGetPropId('author', document);
    if (!authorId) {
      sails.log.debug(
        `notifyAuthor: document ${document.id} has no author, skipping notification`
      );
      return true;
    }
    if (authorId === moderatorId) {
      return true;
    }

    if (!Object.values(NOTIFICATION_TYPES).includes(notificationType)) {
      throw new Error(`Invalid notification type: ${notificationType}`);
    }

    try {
      const notificationTypeRecord = await TNotificationType.findOne({
        name: notificationType,
      });

      if (!notificationTypeRecord) {
        throw new Error(
          `Notification type '${notificationType}' not found in DB — migration may not have run`
        );
      }

      await TNotification.create({
        dateInscription: new Date(),
        notificationType: notificationTypeRecord.id,
        notifier: moderatorId,
        notified: authorId,
        document: document.id,
      });

      const author = await TCaver.findOne(authorId);

      if (author && author.sendNotificationByEmail) {
        await sendNotificationEmail(
          document,
          notificationType,
          NOTIFICATION_ENTITIES.DOCUMENT,
          {
            ...author,
            isAuthorNotification: true,
            validationComment,
          }
        );
      }

      return true;
    } catch (error) {
      sails.log.error(
        `An error occurred when trying to notify the document author: ${error.message} ${error.stack}`
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
      const populatedDocuments = await DocumentService.getDocuments([
        safeGetPropId('document', notification),
      ]);
      populatedNotification.document = populatedDocuments[0];
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
