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

  '/': {
    controller: 'Index',
    action: 'index',
    csrf: true,
  },

  '/ui': {
    controller: 'Index',
    action: 'index',
    csrf: true,
  },

  '/ui/*': {
    controller: 'Index',
    action: 'index',
    csrf: true,
  },

  '/admin/*': {
    controller: 'Index',
    action: 'index',
  },

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

  /* For ReactRouter routes */
  'GET /auth/*': {
    view: 'grottocenter',
  },

  'GET /auth/signin': {
    view: 'grottocenter',
  },

  'GET /auth/signup': {
    view: 'grottocenter',
  },

  'GET /ui/swagger/': {
    csrf: false,
  },

  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

  /* Auth controller */
  'POST /api/v1/login': {
    controller: 'v1/Auth',
    action: 'login',
  },

  'POST /api/v1/signup': {
    controller: 'v1/Auth',
    action: 'signUp',
  },

  'GET /api/v1/logout': {
    controller: 'v1/Auth',
    action: 'logout',
  },

  /* Caver controller */
  'GET /api/v1/cavers/': {
    controller: 'v1/Caver',
    action: 'find',
  },

  'POST /api/v1/cavers/': {
    controller: 'v1/Caver',
    action: 'create',
  },

  'GET /api/v1/cavers/findAll': {
    controller: 'v1/Caver',
    action: 'findAll',
  },

  'GET /api/v1/cavers/count': {
    controller: 'v1/Caver',
    action: 'getCaversNumber',
  },

  'GET /api/v1/cavers/:id': {
    controller: 'v1/Caver',
    action: 'find',
  },

  'PUT /api/v1/cavers/:caverId/groups/:groupId': {
    controller: 'v1/Caver',
    action: 'putOnGroup',
  },

  'DELETE /api/v1/cavers/:caverId/groups/:groupId': {
    controller: 'v1/Caver',
    action: 'removeFromGroup',
  },

  'POST /api/v1/cavers/:caverId/groups': {
    controller: 'v1/Caver',
    action: 'setGroups',
  },

  'GET /api/v1/cavers/admins': {
    controller: 'v1/Caver',
    action: 'getAdmins',
  },

  'GET /api/v1/cavers/moderators': {
    controller: 'v1/Caver',
    action: 'getModerators',
  },

  /* Entrance controller */
  'GET /api/entrances/findRandom': {
    controller: 'Entrance',
    action: 'findRandom',
  },

  'GET /api/v1/entrances/publicCount': {
    controller: 'v1/Entrance',
    action: 'publicCount',
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/v1/entrances/count': {
    controller: 'Entrance',
    action: 'count',
  },

  'GET /api/v1/entrances/:id': {
    controller: 'v1/Entrance',
    action: 'find',
    cors: {
      allowOrigins: '*',
    },
  },

  /* REST API for Cave controller */
  'POST /api/caves/': {
    controller: 'Cave',
    action: 'create',
  },

  'GET /api/v1/caves/findAll': {
    controller: 'Cave',
    action: 'findAll',
  },

  'GET /api/v1/caves/:id': {
    controller: 'Cave',
    action: 'find',
  },

  'PUT /api/caves/:id': {
    controller: 'Cave',
    action: 'update',
  },

  'DELETE /api/caves/:id': {
    controller: 'Cave',
    action: 'delete',
  },

  /* Author controller */
  'POST /api/authors/': {
    controller: 'Author',
    action: 'create',
  },

  'GET /api/authors/:id': {
    controller: 'Author',
    action: 'find',
  },

  'PUT /api/authors/:id': {
    controller: 'Author',
    action: 'update',
  },

  'DELETE /api/authors/:id': {
    controller: 'Author',
    action: 'delete',
  },

  'GET /api/authors/findAll': {
    controller: 'Author',
    action: 'findAll',
  },

  /* REST API for Partner controller */
  'POST /api/partners/': {
    controller: 'Partner',
    action: 'create',
  },

  'GET /api/partners/findAll': {
    controller: 'Partner',
    action: 'findAll',
  },

  'GET /api/partners/findForCarousel/:skip/:limit': {
    controller: 'Partner',
    action: 'findForCarousel',
  },

  'GET /api/partners/findForCarousel': {
    controller: 'Partner',
    action: 'findForCarousel',
  },

  'GET /api/partners/:id': {
    controller: 'Partner',
    action: 'find',
  },

  'PUT /api/partners/:id': {
    controller: 'Partner',
    action: 'update',
  },

  'DELETE /api/partners/:id': {
    controller: 'Partner',
    action: 'delete',
  },

  /* REST API for Comment controller */
  'GET /api/comments/stats/:entry': {
    controller: 'Comment',
    action: 'getEntryStats',
  },

  'GET /api/comments/timeinfos/:entry': {
    controller: 'Comment',
    action: 'getEntryTimeInfos',
  },

  /* REST API for Organization controller */
  'POST /api/v1/organizations': {
    controller: 'v1/Grotto',
    action: 'create',
  },

  'GET /api/organizations/findAll': {
    controller: 'Grotto',
    action: 'findAll',
  },

  'GET /api/organizations/officialCount': {
    controller: 'Grotto',
    action: 'getOfficialPartnersNumber',
  },

  'GET /api/organizations/count': {
    controller: 'Grotto',
    action: 'getPartnersNumber',
  },

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

  /* REST API for Massif controller */
  'GET /api/massifs/:id': {
    controller: 'Massif',
    action: 'find',
  },

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

  /* REST API for Documents controllers */
  'GET /api/v1/documents/count': {
    controller: 'v1/Document',
    action: 'count',
  },

  'POST /api/v1/documents': {
    controller: 'v1/Document',
    action: 'create',
  },

  'PUT /api/v1/documents/:id': {
    controller: 'v1/Document',
    action: 'update',
  },

  'GET /api/v1/documents/types/:id': {
    controller: 'v1/DocumentType',
    action: 'find',
  },

  'GET /api/v1/documents/types': {
    controller: 'v1/DocumentType',
    action: 'findAll',
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

  'GET /api/v1/documents': {
    controller: 'v1/Document',
    action: 'findAll',
  },

  'GET /api/v1/documents/:id': {
    controller: 'v1/Document',
    action: 'find',
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

  'PUT /api/v1/documents/:id/validate': {
    controller: 'v1/Document',
    action: 'validate',
  },

  'PUT /api/v1/documents/validate': {
    controller: 'v1/Document',
    action: 'multipleValidate',
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

  /* REST API for Region controller */
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

  /* REST API for Admin controller */
  'GET /api/admin/entrances/findAllOfInterest': {
    controller: 'Admin',
    action: 'findAllInterestEntries',
  },

  /* Rss controller */
  'GET /api/rss/:language': {
    controller: 'Rss',
    action: 'getFeed',
  },

  /* Geo localisation API */
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

  /* Search */
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

  /* Languages */
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

  /* Convert */
  'GET /api/convert': {
    controller: 'ConvertController',
    action: 'convert',
    cors: {
      allowOrigins: '*',
    },
  },

  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝

  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝
};
