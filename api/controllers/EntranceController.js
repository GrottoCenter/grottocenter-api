/**
 * EntranceController
 *
 * @description :: Server-side logic for managing entrances
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
const ramda = require('ramda');
const getCountryISO3 = require('country-iso-2-to-3');

// Extract everything from the request body except id
const getConvertedDataFromClientRequest = (req) => {
  const { id, ...reqBodyWithoutId } = req.body; // remove id if present to avoid null id (and an error)
  return {
    ...reqBodyWithoutId,
    author: req.token.id,
    geology: ramda.propOr('Q35758', 'geology', req.body),
  };
};

const getConvertedNameDescLocFromClientRequest = (req) => {
  let result = {
    name: {
      author: req.token.id,
      text: req.param('name').text,
      language: req.param('name').language,
    },
  };
  if (ramda.pathOr(null, ['description', 'body'], req.body)) {
    result = {
      ...result,
      description: {
        author: req.token.id,
        body: req.body.description.body,
        language: req.body.description.language,
        title: req.body.description.title,
      },
    };
  }

  if (ramda.pathOr(null, ['location', 'body'], req.body)) {
    result = {
      ...result,
      location: {
        author: req.token.id,
        body: req.body.location.body,
        language: req.body.location.language,
      },
    };
  }

  return result;
};

const iso2ToIso3 = (iso) => {
  if (iso !== undefined) {
    if (iso === 'EN') {
      return 'eng';
    }
    const res = getCountryISO3(iso);
    if (res) {
      return res.toLowerCase();
    } else {
      throw Error('This iso code is incorrect : ' + iso);
    }
  }
  return null;
};

/* _______________________________________

  The following functions are used to extract the relevant information from the import csv module.
  ________________________________________
*/

const getConvertedEntranceFromCsv = (rawData, idAuthor, cave) => {
  const doubleCheck = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });
  return {
    author: idAuthor,
    country: doubleCheck({
      key: 'gn:countryCode',
    }),
    precision: doubleCheck({
      key: 'dwc:coordinatePrecision',
    }),
    altitude: doubleCheck({
      key: 'w3geo:altitude',
    }),
    latitude: cave.latitude,
    longitude: cave.longitude,
    cave: cave.id,
    dateInscription: doubleCheck({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheck({
      key: 'dct:rights/dct:modified',
    }),
    isOfInterest: false,
    idDbImport: doubleCheck({
      key: 'id',
    }),
    nameDbImport: doubleCheck({
      key: 'dct:rights/cc:attributionName',
    }),
    //Default value, never provided by csv import
    geology: 'Q35758',
  };
};

const getConvertedNameDescLocEntranceFromCsv = async (rawData, authorId) => {
  const doubleCheck = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });
  let result = {};
  if (
    doubleCheck({
      key: 'karstlink:hasDescriptionDocument/dct:title',
    })
  ) {
    result = {
      description: {
        body: doubleCheck({
          key: 'karstlink:hasDescriptionDocument/dct:description',
        }),
        language: doubleCheck({
          key: 'karstlink:hasDescriptionDocument/dc:language',
          func: (value) => value.toLowerCase(),
        }),
        title: doubleCheck({
          key: 'karstlink:hasDescriptionDocument/dct:title',
        }),
        author: authorId,
        dateInscription: doubleCheck({
          key: 'dct:rights/dct:created',
          defaultValue: new Date(),
        }),
        dateReviewed: doubleCheck({
          key: 'dct:rights/dct:modified',
        }),
      },
    };
  }

  if (doubleCheck({ key: 'rdfs:label' })) {
    result = {
      ...result,
      name: {
        author: authorId,
        text: rawData['rdfs:label'],
        language: doubleCheck({
          key: 'gn:countryCode',
          func: iso2ToIso3,
        }),
        dateInscription: doubleCheck({
          defaultValue: new Date(),
        }),
        dateReviewed: doubleCheck({
          key: 'dct:rights/dct:modified',
        }),
      },
    };
  }
  if (
    doubleCheck({
      key: 'karstlink:hasAccessDocument/dct:description',
    })
  ) {
    let authorLoc = authorId;
    const authorFromCsv = doubleCheck({
      key: 'karstlink:hasAccessDocument/dct:creator',
    });
    if (authorFromCsv) {
      const auth = await sails.helpers.csvhelpers.getCreator.with({
        creator: authorFromCsv,
      });
      authorLoc = auth.id;
    }
    result = {
      ...result,
      location: {
        body: rawData['karstlink:hasAccessDocument/dct:description'],
        title: doubleCheck({
          key: 'karstlink:hasAccessDocument/dct:description',
        }),
        language: doubleCheck({
          key: 'karstlink:hasAccessDocument/dc:language',
          func: (value) => value.toLowerCase(),
        }),
        author: authorLoc,
        dateInscription: doubleCheck({
          key: 'dct:rights/dct:created',
          defaultValue: new Date(),
        }),
        dateReviewed: doubleCheck({
          key: 'dct:rights/dct:modified',
          defaultValue: undefined,
        }),
      },
    };
  }
  return result;
};

const getConvertedCaveFromCsv = (rawData, idAuthor) => {
  const doubleCheck = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });

  let depth = doubleCheck({
    key: 'karstlink:verticalExtend',
  });
  if (!depth) {
    depth =
      parseInt(
        doubleCheck({
          key: 'karstlink:extendBelowEntrance',
          defaultValue: 0,
        }),
        10,
      ) +
      parseInt(
        doubleCheck({
          key: 'karstlink:extendAboveEntrance',
          defaultValue: 0,
        }),
        10,
      );
  }
  return {
    // The TCave.create() function doesn't work with TCave field alias. See TCave.js Model
    /* eslint-disable camelcase */
    id_author: idAuthor,
    latitude: doubleCheck({
      key: 'w3geo:latitude',
    }),
    longitude: doubleCheck({
      key: 'w3geo:longitude',
    }),
    length: doubleCheck({
      key: 'karstlink:length',
    }),
    depth: depth,
    date_inscription: doubleCheck({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    date_reviewed: doubleCheck({
      key: 'dct:rights/dct:modified',
    }),
  };
};

const getConvertedNameAndDescCaveFromCsv = (rawData, authorId) => {
  const doubleCheck = (args) =>
    sails.helpers.csvhelpers.doubleCheck.with({ data: rawData, ...args });

  return {
    author: authorId,
    name: doubleCheck({
      key: 'rdfs:label',
    }),
    descriptionAndNameLanguage: {
      id: doubleCheck({
        key: 'karstlink:hasDescriptionDocument/dc:language',
        func: (value) => value.toLowerCase(),
      }),
    },
    dateInscription: doubleCheck({
      key: 'dct:rights/dct:created',
      defaultValue: new Date(),
    }),
    dateReviewed: doubleCheck({
      key: 'dct:rights/dct:modified',
    }),
  };
  //No description provided by the csv
};

module.exports = {
  find: async (req, res, converter) => {
    TEntrance.findOne(req.params.id)
      .populate('author')
      .populate('cave')
      .populate('names')
      .populate('descriptions')
      .populate('geology')
      .populate('locations')
      .populate('documents')
      .populate('riggings')
      .populate('comments')
      .exec(async (err, found) => {
        const params = {};
        params.searchedItem = `Entrance of id ${req.params.id}`;

        if (!found) {
          const notFoundMessage = `${params.searchedItem} not found`;
          sails.log.debug(notFoundMessage);
          res.status(404);
          return res.json({ error: notFoundMessage });
        }

        // Populate massif
        if (found.cave.id_massif) {
          // eslint-disable-next-line camelcase
          found.cave.id_massif = await TMassif.findOne({
            id: found.cave.id_massif, // eslint-disable-line camelcase
          })
            .populate('names')
            .populate('descriptions');
          await NameService.setNames([found.cave.id_massif], 'massif');
        }

        // ===== Populate all authors
        // eslint-disable-next-line camelcase
        found.cave.id_author = await CaverService.getCaver(
          found.cave.id_author,
          req,
        ); // using id_author because of a bug in Sails ORM... See TCave() file for explaination
        found.comments.map(
          async (c) => (c.author = await CaverService.getCaver(c.author, req)),
        );
        found.locations.map(
          async (l) => (l.author = await CaverService.getCaver(l.author, req)),
        );
        found.riggings.map(
          async (r) => (r.author = await CaverService.getCaver(r.author, req)),
        );

        // Populate cave
        await CaveService.setEntrances([found.cave]);
        await NameService.setNames([found.cave], 'cave');

        // Populate stats
        found.stats = await CommentService.getStats(req.params.id);

        // Format rigging obstacle
        await RiggingService.formatRiggings(found.riggings);

        // Sensitive entrance special treatment
        if (found.isSensitive) {
          const hasCompleteViewRight = req.token
            ? await sails.helpers.checkRight
                .with({
                  groups: req.token.groups,
                  rightEntity: RightService.RightEntities.ENTRANCE,
                  rightAction: RightService.RightActions.VIEW_COMPLETE,
                })
                .intercept('rightNotFound', (err) => {
                  return res.serverError(
                    'A server error occured when checking your right to entirely view an entrance.',
                  );
                })
            : false;

          const hasLimitedViewRight = req.token
            ? await sails.helpers.checkRight
                .with({
                  groups: req.token.groups,
                  rightEntity: RightService.RightEntities.ENTRANCE,
                  rightAction: RightService.RightActions.VIEW_LIMITED,
                })
                .intercept('rightNotFound', (err) => {
                  return res.serverError(
                    'A server error occured when checking your right to have a limited view of a sensible entrance.',
                  );
                })
            : false;
          if (!hasLimitedViewRight && !hasCompleteViewRight) {
            return res.forbidden(
              'You are not authorized to view this sensible entrance.',
            );
          }
          if (!hasCompleteViewRight) {
            delete found.locations;
            delete found.longitude;
            delete found.latitude;
          }
        }
        return ControllerService.treatAndConvert(
          req,
          err,
          found,
          params,
          res,
          converter,
        );
      });
  },

  findRandom: (
    req,
    res,
    next,
    converter = MappingV1Service.convertToEntranceModel,
  ) => {
    const params = {};
    params.searchedItem = `Random entrance`;
    EntranceService.findRandom()
      .then((result) => {
        if (!result) {
          return res.notFound();
        }
        return ControllerService.treatAndConvert(
          req,
          null,
          result,
          params,
          res,
          converter,
        );
      })
      .catch((err) => {
        return ControllerService.treatAndConvert(
          req,
          err,
          undefined,
          params,
          res,
          converter,
        );
      });
  },

  publicCount: (req, res, converter) => {
    TEntrance.count({ isPublic: true })
      .then((total) => {
        return res.json(converter({ count: total }));
      })
      .catch((err) => {
        const errorMessage =
          'An internal error occurred when getting number of public entrances';
        sails.log.error(`${errorMessage}: ${err}`);
        return res.status(500).json({ error: errorMessage });
      });
  },

  count: (req, res) => {
    TEntrance.count().exec((err, found) => {
      const params = {};
      params.controllerMethod = 'EntranceController.count';
      params.notFoundMessage = 'Problem while getting number of entrances.';

      const count = {};
      count.count = found;
      return ControllerService.treat(req, err, count, params, res);
    });
  },

  create: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.CREATE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to create an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to create an entrance.');
    }

    // Check params
    // name
    if (
      !ramda.propOr(null, 'text', req.param('name')) ||
      !ramda.propOr(null, 'language', req.param('name'))
    ) {
      return res.badRequest(
        'You must provide a name (with a language) for the new entrance',
      );
    }

    // cave
    if (!req.param('cave')) {
      return res.badRequest('You must provide a cave id for the new entrance');
    }
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: req.param('cave'),
        sailsModel: TCave,
      }))
    ) {
      return res.badRequest(
        `The cave with id ${req.param('cave')} does not exist.`,
      );
    }

    // Get data & create entrance
    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      dateInscription: new Date(),
      isOfInterest: false,
    };

    const nameDescLocData = getConvertedNameDescLocFromClientRequest(req);

    try {
      const newEntrancePopulated = await EntranceService.createEntrance(
        cleanedData,
        nameDescLocData,
      );
      const params = {};
      params.controllerMethod = 'EntranceController.create';
      return ControllerService.treat(
        req,
        null,
        newEntrancePopulated,
        params,
        res,
      );
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  delete: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.DELETE_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to delete an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to delete an entrance.');
    }

    // Check if entrance exists and if it's not already deleted
    const entranceId = req.param('id');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (currentEntrance) {
      if (currentEntrance.isDeleted) {
        return res.status(410).send({
          message: `The entrance with id ${entranceId} has already been deleted.`,
        });
      }
    } else {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    // Delete Entrance
    const updatedEntrance = await TEntrance.destroyOne({
      id: entranceId,
    }).intercept((err) => {
      return res.serverError(
        `An unexpected error occured when trying to delete entrance with id ${entranceId}.`,
      );
    });

    ElasticsearchService.deleteResource('entrances', entranceId);

    return res.sendStatus(204);
  },

  update: async (req, res, converter) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.EDIT_ANY,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to update an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden('You are not authorized to update an entrance.');
    }

    // Check if entrance exists
    const entranceId = req.param('id');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const cleanedData = {
      ...getConvertedDataFromClientRequest(req),
      id: entranceId,
    };

    // Launch update request using transaction: it performs a rollback if an error occurs
    try {
      await sails.getDatastore().transaction(async (db) => {
        const updatedEntrance = await TEntrance.updateOne({
          id: entranceId,
        })
          .set(cleanedData)
          .usingConnection(db);

        await NameService.setNames([updatedEntrance], 'entrance');

        const params = {};
        params.controllerMethod = 'EntranceController.update';
        return ControllerService.treatAndConvert(
          req,
          null,
          updatedEntrance,
          params,
          res,
          converter,
        );
      });
    } catch (e) {
      ErrorService.getDefaultErrorHandler(res)(e);
    }
  },

  addDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.LINK_RESOURCE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to add a document to an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to add a document to an entrance.',
      );
    }

    // Check params
    const entranceId = req.param('entranceId');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const documentId = req.param('documentId');
    if (
      !(await sails.helpers.checkIfExists.with({
        attributeName: 'id',
        attributeValue: documentId,
        sailsModel: TDocument,
      }))
    ) {
      return res
        .status(404)
        .send({ message: `Document of id ${documentId} not found.` });
    }

    // Update entrance
    TEntrance.addToCollection(entranceId, 'documents', documentId)
      .then(() => {
        return res.sendStatus(204);
      })
      .catch({ name: 'UsageError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch({ name: 'AdapterError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch((err) => {
        return res.serverError(err.cause.message);
      });
  },

  unlinkDocument: async (req, res) => {
    // Check right
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.UNLINK_RESOURCE,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to remove a document from an entrance.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to remove a document from an entrance.',
      );
    }

    // Check params
    const entranceId = req.param('entranceId');
    const currentEntrance = await TEntrance.findOne(entranceId);
    if (!currentEntrance) {
      return res.status(404).send({
        message: `Entrance of id ${entranceId} not found.`,
      });
    }

    const documentId = req.param('documentId');
    if (!(await DocumentService.checkIfExists('id', documentId))) {
      return res
        .status(404)
        .send({ message: `Document of id ${documentId} not found.` });
    }

    // Update entrance
    TEntrance.removeFromCollection(entranceId, 'documents', documentId)
      .then(() => {
        return res.sendStatus(204);
      })
      .catch({ name: 'UsageError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch({ name: 'AdapterError' }, (err) => {
        return res.badRequest(err.cause.message);
      })
      .catch((err) => {
        return res.serverError(err.cause.message);
      });
  },

  checkRows: async (req, res) => {
    const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
    const willBeCreated = [];
    const wontBeCreated = [];
    for (const [index, row] of req.body.data.entries()) {
      const idDb = doubleCheck({
        data: row,
        key: 'id',
        defaultValue: undefined,
      });
      const nameDb = doubleCheck({
        data: row,
        key: 'dct:rights/cc:attributionName',
        defaultValue: undefined,
      });
      if (!(idDb && nameDb)) {
        wontBeCreated.push({
          line: index + 2,
        });
      } else {
        const result = await TEntrance.find({
          idDbImport: idDb,
          nameDbImport: nameDb,
        });
        if (result.length > 0) {
          wontBeCreated.push({
            line: index + 2,
          });
        } else {
          willBeCreated.push(row);
        }
      }
    }

    const requestResult = {
      willBeCreated,
      wontBeCreated,
    };
    return res.ok(requestResult);
  },

  importRows: async (req, res) => {
    const hasRight = await sails.helpers.checkRight
      .with({
        groups: req.token.groups,
        rightEntity: RightService.RightEntities.ENTRANCE,
        rightAction: RightService.RightActions.CSV_IMPORT,
      })
      .intercept('rightNotFound', (err) => {
        return res.serverError(
          'A server error occured when checking your right to import entrances via CSV.',
        );
      });
    if (!hasRight) {
      return res.forbidden(
        'You are not authorized to import entraces via CSV.',
      );
    }

    const requestResponse = {
      type: 'entrance',
      total: {
        success: 0,
        failure: 0,
      },
      successfulImport: [],
      failureImport: [],
    };

    for (const [index, data] of req.body.data.entries()) {
      const missingColumns = await sails.helpers.csvhelpers.checkColumns.with({
        data: data,
        additionalColumns: ['w3geo:latitude', 'w3geo:longitude'],
      });

      if (missingColumns.length > 0) {
        requestResponse.failureImport.push({
          line: index + 2,
          message: 'Columns missing : ' + missingColumns.toString(),
        });
      } else {
        try {
          //Author retrieval : create one if not present in db
          const authorId = await sails.helpers.csvhelpers.getAuthor(data);
          //Cave creation
          const dataCave = getConvertedCaveFromCsv(data, authorId);
          const dataNameAndDesc = getConvertedNameAndDescCaveFromCsv(
            data,
            authorId,
          );
          const caveCreated = await CaveService.createCave(
            dataCave,
            dataNameAndDesc,
          );

          //Entrance creation
          const dataEntrance = getConvertedEntranceFromCsv(
            data,
            authorId,
            caveCreated,
          );
          const { dateInscription } = dataEntrance;
          const { dateReviewed } = dataEntrance;
          const dataNameDescLoc = await getConvertedNameDescLocEntranceFromCsv(
            data,
            authorId,
          );
          const entranceCreated = await EntranceService.createEntrance(
            dataEntrance,
            dataNameDescLoc,
          );
          const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
          if (
            doubleCheck({
              data: data,
              key: 'gn:alternateName',
              defaultValue: null,
            })
          ) {
            await TName.create({
              author: authorId,
              entrance: entranceCreated.id,
              dateInscription: dateInscription,
              dateReviewed: dateReviewed,
              isMain: false,
              language: dataNameDescLoc.name.language,
              name: data['gn:alternateName'].name,
            });
          }

          requestResponse.successfulImport.push({
            caveId: caveCreated.id,
            entranceId: entranceCreated.id,
            latitude: entranceCreated.latitude,
            longitude: entranceCreated.longitude,
          });
        } catch (err) {
          sails.log.error(err);
          requestResponse.failureImport.push({
            line: index + 2,
            message: err.toString(),
          });
        }
      }
    }

    requestResponse.total.success = requestResponse.successfulImport.length;
    requestResponse.total.failure = requestResponse.failureImport.length;
    return res.ok(requestResponse);
  },
};
