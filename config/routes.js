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
    csrf: true
  },

  '/ui/*': {
    controller: 'Index',
    action: 'index',
    csrf: true
  },

	'/admin/*': {
		controller: 'Index',
		action: 'index'
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
    action: 'security/grant-csrf-token'
  },

  /* For ReactRouter routes */

  'GET /auth/*': {
    view: 'grottocenter'
  },

  'GET /auth/signin': {
    view: 'grottocenter'
  },

  'GET /auth/signup': {
    view: 'grottocenter'
  },

  'GET /ui/swagger/': {
    csrf: false
  },


  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

  /* Auth controller */

  'POST /api/auth/login': {
    controller: 'Auth',
    action: 'login'
  },

  'GET /api/auth/logout': {
    controller: 'Auth',
    action: 'logout'
  },

  /* Caver controller */

  'GET /api/caver/': {
    controller: 'Caver',
    action: 'find'
  },

  'POST /api/caver/': {
    controller: 'Caver',
    action: 'create'
  },

  'GET /api/caver/findAll': {
    controller: 'Caver',
    action: 'findAll'
  },

  'GET /api/v1/search/findAll': {
    controller: 'v1/Search',
    action: 'findAll',
    api: {
      entity: 'search',
      limit: 50,
    },
    cors: {
      allowOrigins: '*'
    }
  },

  'GET /api/caver/count': {
    controller: 'Caver',
    action: 'getCaversNumber'
  },

  'GET /api/caver/:id': {
    controller: 'Caver',
    action: 'find'
  },

  'GET /api/:version/caver/:id': {
    controller: 'Caver',
    action: 'findVersion'
  },

  'PUT /api/caver/:id': {
    controller: 'Caver',
    action: 'update'
  },

  'DELETE /api/caver/:id': {
    controller: 'Caver',
    action: 'destroy'
  },

  /* Entry controller */

  'GET /api/entry/findAll': {
    controller: 'Entry',
    action: 'findAll'
  },

  'GET /api/v1/entries': {
    controller: 'v1/Entry',
    action: 'findAll',
    api: {
      entity: 'entry',
      limit: 50,
    },
    cors: {
      origin: '*'
    }
  },

  'GET /api/entry/findRandom': {
    controller: 'Entry',
    action: 'findRandom'
  },

  'GET /api/v1/entry/publicCount': {
    controller: 'v1/Entry',
    action: 'getPublicEntriesNumber',
    cors: {
      allowOrigins: '*'
    }
  },

  'GET /api/entry/count': {
    controller: 'Entry',
    action: 'getEntriesNumber'
  },

  'GET /api/v1/entry/:id': {
    controller: 'v1/Entry',
    action: 'find',
    cors: {
      allowOrigins: '*'
    }
  },

  /* REST API for Cave controller */

  'POST /api/cave/': {
    controller: 'Cave',
    action: 'create'
  },

  'GET /api/cave/findAll': {
    controller: 'Cave',
    action: 'findAll'
  },

  'GET /api/cave/:id': {
    controller: 'Cave',
    action: 'find'
  },

  'PUT /api/cave/:id': {
    controller: 'Cave',
    action: 'update'
  },

  'DELETE /api/cave/:id': {
    controller: 'Cave',
    action: 'delete'
  },

  /* Author controller */

  'POST /api/author/': {
    controller: 'Author',
    action: 'create'
  },

  'GET /api/author/:id': {
    controller: 'Author',
    action: 'find'
  },

  'PUT /api/author/:id': {
    controller: 'Author',
    action: 'update'
  },

  'DELETE /api/author/:id': {
    controller: 'Author',
    action: 'delete'
  },

  'GET /api/author/findAll': {
    controller: 'Author',
    action: 'findAll'
  },

  /* REST API for Partner controller */

  'POST /api/partner/': {
    controller: 'Partner',
    action: 'create'
  },

  'GET /api/partner/findAll': {
    controller: 'Partner',
    action: 'findAll'
  },

  'GET /api/partner/findForCarousel/:skip/:limit': {
    controller: 'Partner',
    action: 'findForCarousel'
  },

  'GET /api/partner/findForCarousel': {
    controller: 'Partner',
    action: 'findForCarousel'
  },

  'GET /api/partner/:id': {
    controller: 'Partner',
    action: 'find'
  },

  'PUT /api/partner/:id': {
    controller: 'Partner',
    action: 'update'
  },

  'DELETE /api/partner/:id': {
    controller: 'Partner',
    action: 'delete'
  },

  /* REST API for Topography controller */

  'POST /api/topo/': {
    controller: 'Topography',
    action: 'create'
  },

  'GET /api/topo/findAll': {
    controller: 'Topography',
    action: 'findAll'
  },

  'GET /api/topo/:id': {
    controller: 'Topography',
    action: 'find'
  },

  'PUT /api/topo/:id': {
    controller: 'Topography',
    action: 'update'
  },

  'DELETE /api/topo/:id': {
    controller: 'Topography',
    action: 'delete'
  },

  /* REST API for Comment controller */

  'GET /api/comment/stats/:entry': {
    controller: 'Comment',
    action: 'getEntryStats'
  },

  'GET /api/comment/timeinfos/:entry': {
    controller: 'Comment',
    action: 'getEntryTimeInfos'
  },

  /* REST API for Grotto controller */

  'GET /api/grotto/findAll': {
    controller: 'Grotto',
    action: 'findAll'
  },

  'GET /api/grotto/officialCount': {
    controller: 'Grotto',
    action: 'getOfficialPartnersNumber'
  },

  'GET /api/grotto/count': {
    controller: 'Grotto',
    action: 'getPartnersNumber'
  },

  'GET /api/grotto/:id': {
    controller: 'Grotto',
    action: 'find'
  },

  /* REST API for Admin controller */

  'GET /api/admin/entry/findAllOfInterest': {
    controller: 'Admin',
    action: 'findAllInterestEntries'
  },

  /* Rss controller */

  'GET /api/rss/:language': {
    controller: 'Rss',
    action: 'getFeed'
  },

  /* Geo localisation API */

  'GET /api/v1/geoloc/countEntries': {
    controller: 'v1/GeoLoc',
    action: 'countEntries',
    cors: {
      allowOrigins: '*'
    }
  },

  'GET /api/v1/geoloc/findByBounds': {
    controller: 'v1/GeoLoc',
    action: 'findByBounds',
    cors: {
      allowOrigins: '*'
    }
  },


  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝


  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝
};
