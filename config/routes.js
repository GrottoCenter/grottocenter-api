/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {
  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝

  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
   * etc. depending on your default view engine) your home page.              *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  /***************************************************************************
   *                                                                          *
   * Custom routes here...                                                    *
   *                                                                          *
   *  If a request to a URL doesn't match any of the custom routes above, it  *
   * is matched against Sails route blueprints. See `config/blueprints.js`    *
   * for configuration options and examples.                                  *
   *                                                                          *
   ***************************************************************************/

  /* CSRF */
  'GET /csrfToken': {
    action: 'security/grant-csrf-token',
  },

  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

  /* Swagger doc endpoint */
  'GET /api/v1/swagger.yaml': 'v1/Swagger.sendYaml',

  /* Account controller */
  'PATCH /api/v1/account/password': 'v1/Account.changePassword',
  'PATCH /api/v1/account/alertForNews': 'v1/Account.changeAlertForNews',
  'PATCH /api/v1/account/email': 'v1/Account.changeEmail',
  'POST /api/v1/forgotPassword': 'v1/Account.forgotPassword',

  /* Auth controller */
  'GET /api/v1/logout': 'v1/Auth.logout',
  'POST /api/v1/login': 'v1/Auth.login',
  'POST /api/v1/signup': 'v1/Auth.signUp',

  /* Caver controller */
  'DELETE /api/v1/cavers/:caverId/entrances/:entranceId':
    'v1/Caver.removeExploredEntrance',
  'DELETE /api/v1/cavers/:caverId/groups/:groupId': 'v1/Caver.removeFromGroup',
  'GET /api/v1/cavers/': 'v1/Caver.findAll',
  'GET /api/v1/cavers/:id': 'v1/Caver.find',
  'GET /api/v1/cavers/admins': 'v1/Caver.getAdmins',
  'GET /api/v1/cavers/count': 'v1/Caver.count',
  'GET /api/v1/cavers/users/count': 'v1/Caver.usersCount',
  'GET /api/v1/cavers/findAll': 'v1/Caver.findAll',
  'GET /api/v1/cavers/moderators': 'v1/Caver.getModerators',
  'POST /api/v1/cavers/': 'v1/Caver.create',
  'POST /api/v1/cavers/:caverId/groups': 'v1/Caver.setGroups',
  'PUT /api/v1/cavers/:caverId/entrances/:entranceId':
    'v1/Caver.addExploredEntrance',
  'PUT /api/v1/cavers/:caverId/groups/:groupId': 'v1/Caver.putOnGroup',

  /* Entrance controller */
  'DELETE /api/v1/entrances/:id': 'v1/Entrance.delete',
  'DELETE /api/v1/entrances/:entranceId/documents/:documentId':
    'v1/Entrance.unlinkDocument',
  'GET /api/v1/entrances/count': 'v1/Entrance.count',
  'GET /api/v1/entrances/findRandom': 'v1/Entrance.findRandom',
  'GET /api/v1/entrances/publicCount': {
    controller: 'v1/Entrance',
    action: 'publicCount',
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/entrances/:id': {
    controller: 'v1/Entrance',
    action: 'find',
    cors: {
      allowOrigins: '*',
    },
  },
  'POST /api/v1/entrances': 'v1/Entrance.create',
  'POST /api/v1/entrances/check-rows': 'v1/Entrance.checkRows',
  'POST /api/v1/entrances/import-rows': 'v1/Entrance.importRows',
  'PUT /api/v1/entrances/:id': 'v1/Entrance.update',
  'PUT /api/v1/entrances/:entranceId/documents/:documentId':
    'v1/Entrance.addDocument',

  /* Cave controller */
  'DELETE /api/v1/caves/:id': 'v1/Cave.delete',
  'GET /api/v1/caves/:id': 'v1/Cave.find',
  'GET /api/v1/caves': 'v1/Cave.findAll',
  'POST /api/v1/caves': 'v1/Cave.create',
  'POST /api/v1/caves/:sourceCaveId/merge-into/:destinationCaveId':
    'v1/Cave.merge',
  'PUT /api/v1/caves/:caveId/documents/:documentId': 'v1/Cave.addDocument',
  'PUT /api/v1/caves/:id': 'v1/Cave.update',
  'PUT /api/v1/caves/:caveId/massif/:massifId': 'v1/Cave.setMassif',
  /**
   * @deprecated use api/v1/caves instead
   */
  'GET /api/v1/caves/findAll': 'v1/Cave.findAll',

  /* Partner controller */
  'DELETE /api/partners/:id': 'Partner.delete',
  'GET /api/partners/:id': 'Partner.find',
  'GET /api/v1/partners/count': 'v1/Partner.count',
  'GET /api/partners/findAll': 'Partner.findAll',
  'GET /api/v1/partners/findForCarousel': 'v1/Partner.findForCarousel',
  'GET /api/partners/findForCarousel/:skip/:limit':
    'v1/Partner.findForCarousel',
  'POST /api/partners/': 'Partner.create',
  'PUT /api/partners/:id': 'Partner.update',

  /* Comment controller */
  'GET /api/comments/stats/:entry': 'Comment.getEntryStats',
  'GET /api/comments/timeinfos/:entry': 'Comment.getEntryTimeInfos',

  /* Organization controller */
  'DELETE /api/v1/organizations/:id': 'v1/Grotto.delete',
  'GET /api/v1/organizations/count': 'v1/Grotto.count',
  'GET /api/organizations/findAll': 'Grotto.findAll',
  'GET /api/v1/organizations/:id': {
    controller: 'v1/Grotto',
    action: 'find',
    api: {
      entity: 'grotto',
    },
    cors: {
      allowOrigins: '*',
    },
  },
  'POST /api/v1/organizations': 'v1/Grotto.create',
  'PUT /api/v1/organizations/:id': 'v1/Grotto.update',

  /* Massif controller */
  'DELETE /api/v1/massifs/:id': 'v1/Massif.delete',
  'GET /api/v1/massifs/:id': {
    controller: 'v1/Massif',
    action: 'find',
    api: {
      entity: 'massif',
    },
    cors: {
      allowOrigins: '*',
    },
  },
  'POST /api/v1/massifs': 'v1/Massif.create',

  /* Document controller */
  'GET /api/v1/documents': 'v1/Document.findAll',
  'GET /api/v1/documents/:id': 'v1/Document.find',
  'GET /api/v1/documents/:id/children': 'v1/Document.findChildren',
  'GET /api/v1/documents/count': 'v1/Document.count',
  'POST /api/v1/documents': 'v1/Document.create',
  'POST /api/v1/documents/check-rows': 'v1/Document.checkRows',
  'POST /api/v1/documents/import-rows': 'v1/Document.importRows',
  'PUT /api/v1/documents/:id': 'v1/Document.update',
  'PUT /api/v1/documents/:id/validate': 'v1/Document.validate',
  'PUT /api/v1/documents/validate': 'v1/Document.multipleValidate',

  /* Document Type controller */
  'GET /api/v1/documents/types': 'v1/DocumentType.findAll',
  'GET /api/v1/documents/types/:id': 'v1/DocumentType.find',

  /* Description controller */
  'PATCH /api/v1/descriptions/:id': 'v1/Description.update',
  'POST /api/v1/descriptions': 'v1/Description.create',

  /* Name controller */
  'PATCH /api/v1/names/:id': 'v1/Name.update',
  'POST /api/v1/names/:id/setAsMain': 'v1/Name.setAsMain',

  /* Location controller */
  'PATCH /api/v1/locations/:id': 'v1/Location.update',
  'POST /api/v1/locations': 'v1/Location.create',

  /* Document Subject controller */
  'GET /api/v1/documents/subjects': {
    controller: 'v1/Subject',
    action: 'findAll',
    api: {
      entity: 'subject',
    },
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/documents/subjects/:code': {
    controller: 'v1/Subject',
    action: 'find',
    skipAssets: false, // Disable this parameter to allow a dot in the url (for the code)
    api: {
      entity: 'subject',
    },
    cors: {
      allowOrigins: '*',
    },
  },
  'POST /api/v1/documents/subjects/search/logical/or': {
    controller: 'v1/Subject',
    action: 'search',
    api: {
      entity: 'subject',
    },
    cors: {
      allowOrigins: '*',
    },
  },

  /* REST API for Document Identifier Types controller */
  'GET /api/v1/documents/identifierTypes': {
    controller: 'v1/IdentifierType',
    action: 'findAll',
    api: {
      entity: 'identifierType',
    },
    cors: {
      allowOrigins: '*',
    },
  },

  /* Region controller */
  'POST /api/v1/regions/search/logical/or': {
    controller: 'v1/Region',
    action: 'search',
    api: {
      entity: 'region',
    },
    cors: {
      allowOrigins: '*',
    },
  },

  /* Admin controller */
  'GET /api/admin/entrances/findAllOfInterest':
    'Admin.findAllInterestEntrances',

  /* Rss controller */
  'GET /api/rss/:language': 'Rss.getFeed',

  /* Geo localisation controller */
  'GET /api/v1/geoloc/countEntries': {
    controller: 'v1/GeoLoc',
    action: 'countEntries',
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/geoloc/caves': {
    controller: 'v1/GeoLoc',
    action: 'findCaves',
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/geoloc/cavesCoordinates': {
    controller: 'v1/GeoLoc',
    action: 'findCavesCoordinates',
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/geoloc/grottos': {
    controller: 'v1/GeoLoc',
    action: 'findGrottos',
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/geoloc/entrances': {
    controller: 'v1/GeoLoc',
    action: 'findEntrances',
    cors: {
      allowOrigins: '*',
    },
  },
  'GET /api/v1/geoloc/entrancesCoordinates': {
    controller: 'v1/GeoLoc',
    action: 'findEntrancesCoordinates',
    cors: {
      allowOrigins: '*',
    },
  },

  /* Search controller*/
  'POST /api/v1/search': {
    controller: 'v1/Search',
    action: 'search',
    cors: {
      allowOrigins: '*',
    },
  },

  'POST /api/v1/advanced-search': {
    controller: 'v1/Search',
    action: 'advancedSearch',
    cors: {
      allowOrigins: '*',
    },
  },

  /* Language controller */
  'GET /api/v1/languages/:id': {
    controller: 'v1/Language',
    action: 'find',
    api: {
      entity: 'language',
    },
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/v1/languages': {
    controller: 'v1/Language',
    action: 'findAll',
    api: {
      entity: 'language',
    },
    cors: {
      allowOrigins: '*',
    },
  },

  /* Users controller */
  'GET /api/v1/cavers/:caverId/documents': 'v1/Document.findByCaverId',

  /* Convert controller */
  'GET /api/convert': {
    controller: 'ConvertController',
    action: 'convert',
    cors: {
      allowOrigins: '*',
    },
  },

  /* License controller */
  'GET /api/v1/licenses': 'v1/License.findAll',

  /* File formats controller */
  'GET /api/v1/file-formats': 'v1/FileFormat.findAll',

  /* Option controller */
  'GET /api/v1/options': 'v1/Option.findAll',

  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝

  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝
};
