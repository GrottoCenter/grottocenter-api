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

  'GET /api/v1/logout': {
    controller: 'v1/Auth',
    action: 'logout',
  },

  /* Caver controller */

  'GET /api/cavers/': {
    controller: 'Caver',
    action: 'find',
  },

  'POST /api/cavers/': {
    controller: 'Caver',
    action: 'create',
  },

  'GET /api/cavers/findAll': {
    controller: 'Caver',
    action: 'findAll',
  },

  'GET /api/v1/search/findAll': {
    controller: 'v1/Search',
    action: 'findAll',
    api: {
      entity: 'search',
      limit: 50,
    },
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/cavers/count': {
    controller: 'Caver',
    action: 'getCaversNumber',
  },

  'GET /api/cavers/:id': {
    controller: 'Caver',
    action: 'find',
  },

  'GET /api/:version/cavers/:id': {
    controller: 'Caver',
    action: 'findVersion',
  },

  'PUT /api/cavers/:id': {
    controller: 'Caver',
    action: 'update',
  },

  'DELETE /api/cavers/:id': {
    controller: 'Caver',
    action: 'destroy',
  },

  /* Entry controller */
  'GET /api/entries/findAll': {
    controller: 'Entrance',
    action: 'findAll',
  },

  'GET /api/v1/entries': {
    controller: 'v1/Entry',
    action: 'findAll',
    api: {
      entity: 'entry',
      limit: 50,
    },
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/entries/findRandom': {
    controller: 'Entrance',
    action: 'findRandom',
  },

  // /!\ DEPRECATED /!\
  'GET /api/v1/entry/publicCount': {
    controller: 'v1/Entrance',
    action: 'getPublicEntrancesNumber',
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/entries/count': {
    controller: 'Entrance',
    action: 'getEntrancesNumber',
  },

  'GET /api/v1/entries/:id': {
    controller: 'v1/Entrance',
    action: 'find',
    cors: {
      allowOrigins: '*',
    },
  },

  // /!\ DEPRECATED (use plural route) /!\
  'GET /api/v1/entry/:id': {
    controller: 'v1/Entry',
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

  'GET /api/caves/findAll': {
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

  /* REST API for Topography controller */

  'POST /api/topos/': {
    controller: 'Topography',
    action: 'create',
  },

  'GET /api/topos/findAll': {
    controller: 'Topography',
    action: 'findAll',
  },

  'GET /api/topos/:id': {
    controller: 'Topography',
    action: 'find',
  },

  'PUT /api/topos/:id': {
    controller: 'Topography',
    action: 'update',
  },

  'DELETE /api/topos/:id': {
    controller: 'Topography',
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

  /* REST API for Grotto controller */

  'GET /api/grottos/findAll': {
    controller: 'Grotto',
    action: 'findAll',
  },

  'GET /api/grottos/officialCount': {
    controller: 'Grotto',
    action: 'getOfficialPartnersNumber',
  },

  'GET /api/grottos/count': {
    controller: 'Grotto',
    action: 'getPartnersNumber',
  },

  'GET /api/grottos/:id': {
    controller: 'Grotto',
    action: 'find',
  },

  'GET /api/v1/grottos/:id': {
    controller: 'v1/Grotto',
    action: 'find',
    api: {
      entity: 'grotto',
      limit: 50,
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
      limit: 50,
    },
    cors: {
      allowOrigins: '*',
    },
  },

  /* REST API for BBS controllers */
  'GET /api/v1/bbs/:id': {
    controller: 'v1/Bbs',
    action: 'find',
    api: {
      entity: 'bbs',
      limit: 50,
    },
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/v1/bbs/count': {
    controller: 'v1/Document',
    action: 'countBBS',
  },

  'GET /api/v1/bbs-geos/:id': {
    controller: 'v1/BbsGeo',
    action: 'find',
    api: {
      entity: 'bbsGeo',
      limit: 50,
    },
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/v1/bbs/subthemes/:id': {
    controller: 'v1/BbsChapter',
    action: 'find',
    api: {
      entity: 'bbsChapter',
      limit: 50,
    },
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/v1/bbs/subthemes': {
    controller: 'v1/BbsChapter',
    action: 'findAll',
    api: {
      entity: 'bbsChapter',
    },
    cors: {
      allowOrigins: '*',
    },
  },

  /* REST API for Admin controller */
  'GET /api/admin/entries/findAllOfInterest': {
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

  'GET /api/v1/geoloc/findByBounds': {
    controller: 'v1/GeoLoc',
    action: 'findByBounds',
    cors: {
      allowOrigins: '*',
    },
  },

  /* Search */
  'GET /api/v1/search': {
    controller: 'v1/Search',
    action: 'search',
    cors: {
      allowOrigins: '*',
    },
  },

  'GET /api/v1/advanced-search': {
    controller: 'v1/Search',
    action: 'advancedSearch',
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
