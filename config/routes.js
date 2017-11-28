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
    swagger: {
      ignore: true
    }
  },

  '/ui/*': {
    controller: 'Index',
    action: 'index',
    swagger: {
      ignore: true
    }
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

  /* For ReactRouter routes */

  'GET /auth/*': {
    view: 'grottocenter',
    swagger: {
      ignore: true
    }
  },

  'GET /ui/*': {
    view: 'grottocenter',
    swagger: {
      ignore: true
    }
  },

  /* Auth controller */

  'POST /api/auth/login': {
    controller: 'Auth',
    action: 'login',
    swagger: {
      ignore: true
    }
  },

  'GET /api/auth/logout': {
    controller: 'Auth',
    action: 'logout',
    swagger: {
      ignore: true
    }
  },

  /* Caver controller */

  'GET /api/caver/': {
    controller: 'Caver',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  'POST /api/caver/': {
    controller: 'Caver',
    action: 'create',
    swagger: {
      ignore: true
    }
  },

  'GET /api/caver/findAll': {
    controller: 'Caver',
    action: 'findAll',
    swagger: {
      ignore: true
    }
  },

  'GET /api/search/findAll': {
    controller: 'Search',
    action: 'findAll',
    cors: {
      origin: '*'
    }
  },

  'GET /api/caver/count': {
    controller: 'Caver',
    action: 'getCaversNumber',
    swagger: {
      ignore: true
    }
  },

  'GET /api/caver/:id': {
    controller: 'Caver',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  'GET /api/:version/caver/:id': {
    controller: 'Caver',
    action: 'findVersion',
    swagger: {
      summary: 'Get caver by ID',
      description: 'Get caver by ID Description',
      produces: ['application/json'],
      tags: ['Caver'],
      responses: {
        '200': {
          description: 'Caver data',
          schema: 'TCaver',
          type: 'array'
        }
      },
      parameters: [
        {
          name: 'id',
          description: 'Requested identifier',
          required: true,
          type: 'integer'
        },
        {
          name: 'version',
          description: 'API version',
          required: true,
          type: 'string'
        }
      ]
    }
  },

  'PUT /api/caver/:id': {
    controller: 'Caver',
    action: 'update',
    swagger: {
      ignore: true
    }
  },

  'DELETE /api/caver/:id': {
    controller: 'Caver',
    action: 'destroy',
    swagger: {
      ignore: true
    }
  },

  /* Entry controller */

  'GET /api/entry/findAll': {
    controller: 'Entry',
    action: 'findAll'
  },

  'GET /api/v1/entry/findAll': {
    controller: 'EntryV1',
    action: 'findAll'
  },

  'GET /api/entry/findRandom': {
    controller: 'Entry',
    action: 'findRandom',
    swagger: {
      ignore: true
    }
  },

  'GET /api/v1/entry/publicCount': {
    controller: 'EntryV1',
    action: 'getPublicEntriesNumber',
    cors: {
      origin: '*'
    }
  },

  'GET /api/entry/count': {
    controller: 'Entry',
    action: 'getEntriesNumber',
    swagger: {
      ignore: true
    }
  },

  'GET /api/v1/entry/:id': {
    controller: 'EntryV1',
    action: 'find',
    cors: {
      origin: '*'
    }
  },

  /* REST API for Cave controller */

  'POST /api/cave/': {
    controller: 'Cave',
    action: 'create',
    swagger: {
      ignore: true
    }
  },

  'GET /api/cave/findAll': {
    controller: 'Cave',
    action: 'findAll',
    swagger: {
      ignore: true
    }
  },

  'GET /api/cave/:id': {
    controller: 'Cave',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  'PUT /api/cave/:id': {
    controller: 'Cave',
    action: 'update',
    swagger: {
      ignore: true
    }
  },

  'DELETE /api/cave/:id': {
    controller: 'Cave',
    action: 'delete',
    swagger: {
      ignore: true
    }
  },

  /* Author controller */

  'POST /api/author/': {
    controller: 'Author',
    action: 'create',
    swagger: {
      ignore: true
    }
  },

  'GET /api/author/:id': {
    controller: 'Author',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  'PUT /api/author/:id': {
    controller: 'Author',
    action: 'update',
    swagger: {
      ignore: true
    }
  },

  'DELETE /api/author/:id': {
    controller: 'Author',
    action: 'delete',
    swagger: {
      ignore: true
    }
  },

  'GET /api/author/findAll': {
    controller: 'Author',
    action: 'findAll',
    swagger: {
      ignore: true
    }
  },

  /* REST API for Partner controller */

  'POST /api/partner/': {
    controller: 'Partner',
    action: 'create',
    swagger: {
      ignore: true
    }
  },

  'GET /api/partner/findAll': {
    controller: 'Partner',
    action: 'findAll',
    swagger: {
      ignore: true
    }
  },

  'GET /api/partner/findForCarousel/:skip/:limit': {
    controller: 'Partner',
    action: 'findForCarousel',
    swagger: {
      ignore: true
    }
  },

  'GET /api/partner/findForCarousel': {
    controller: 'Partner',
    action: 'findForCarousel',
    swagger: {
      ignore: true
    }
  },

  'GET /api/partner/:id': {
    controller: 'Partner',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  'PUT /api/partner/:id': {
    controller: 'Partner',
    action: 'update',
    swagger: {
      ignore: true
    }
  },

  'DELETE /api/partner/:id': {
    controller: 'Partner',
    action: 'delete',
    swagger: {
      ignore: true
    }
  },

  /* REST API for Topography controller */

  'POST /api/topo/': {
    controller: 'Topography',
    action: 'create',
    swagger: {
      ignore: true
    }
  },

  'GET /api/topo/findAll': {
    controller: 'Topography',
    action: 'findAll',
    swagger: {
      ignore: true
    }
  },

  'GET /api/topo/:id': {
    controller: 'Topography',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  'PUT /api/topo/:id': {
    controller: 'Topography',
    action: 'update',
    swagger: {
      ignore: true
    }
  },

  'DELETE /api/topo/:id': {
    controller: 'Topography',
    action: 'delete',
    swagger: {
      ignore: true
    }
  },

  /* REST API for Comment controller */

  'GET /api/comment/stats/:entry': {
    controller: 'Comment',
    action: 'getEntryStats',
    swagger: {
      ignore: true
    }
  },

  'GET /api/comment/timeinfos/:entry': {
    controller: 'Comment',
    action: 'getEntryTimeInfos',
    swagger: {
      ignore: true
    }
  },

  /* REST API for Grotto controller */

  'GET /api/grotto/findAll': {
    controller: 'Grotto',
    action: 'findAll',
    swagger: {
      ignore: true
    }
  },

  'GET /api/grotto/officialCount': {
    controller: 'Grotto',
    action: 'getOfficialPartnersNumber',
    swagger: {
      ignore: true
    }
  },

  'GET /api/grotto/count': {
    controller: 'Grotto',
    action: 'getPartnersNumber',
    swagger: {
      ignore: true
    }
  },

  'GET /api/grotto/:id': {
    controller: 'Grotto',
    action: 'find',
    swagger: {
      ignore: true
    }
  },

  /* REST API for Admin controller */

  'GET /api/admin/entry/findAllOfInterest': {
    controller: 'Admin',
    action: 'findAllInterestEntries',
    swagger: {
      ignore: true
    }
  },

  /* Rss controller */

  'GET /api/rss/:language': {
    controller: 'Rss',
    action: 'getFeed',
    swagger: {
      ignore: true
    }
  }

};
