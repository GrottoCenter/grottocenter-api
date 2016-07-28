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
    view: 'index'
  },
  
  '/build': {
    view: 'homepage'
  },
  
  'GET /react': {
    view: 'react'
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
  
  /* Auth controller */

    'POST /auth/login': {
        controller: 'Auth',
        action: 'login'
    },

    'GET /auth/logout': {
        controller: 'Auth',
        action: 'logout'
    },
	
	/* UI controller */
	
	'GET /ui/': {
		controller: 'UI',
		action: 'index'
	},
	
	'GET /ui/login': {
		controller: 'UI',
		view: 'ui/login'
	},
	
	'GET /ui/cavelist': {
		controller: 'Ui',
		action: 'cavelist'
	},
	
	'GET /ui/cavedetail': {
		controller: 'UI',
		view: 'ui/cavedetail'
	},
	
	'GET /ui/entrylist': {
		controller: 'UI',
		view: 'ui/entrylist'
	},
	
	'GET /ui/entrydetail': {
		controller: 'UI',
		view: 'ui/entrydetail'
	},
	
	'GET /ui/caver/new': {
        controller: 'UI',
        action: 'newcaver'
    },

    /* Caver controller */

    'GET /caver/': {
        controller: 'Caver',
        action: 'find'
    },

    'POST /caver/': {
        controller: 'Caver',
        action: 'create'
    },
	
	'GET /caver/:id': {
        controller: 'Caver',
        action: 'findOne'
    },
	
	'PUT /caver/:id': {
        controller: 'Caver',
        action: 'update'
    },
	
	'DELETE /caver/:id': {
        controller: 'Caver',
        action: 'destroy'
    },

    /* Entry controller */

    'GET /entry/': {
        controller: 'Entry',
        action: 'index'
    },
	
	'GET /entry/findAll': {
        controller: 'Entry',
        action: 'readAll'
    },
	
	/* REST API for Cave controller */
	
	'POST /cave/': {
        controller: 'Cave',
        action: 'create'
    },
	
	'GET /cave/findAll': {
        controller: 'Cave',
        action: 'readAll'
    },
	
	'GET /cave/:id': {
        controller: 'Cave',
        action: 'read'
    },
	
	'PUT /cave/:id': {
        controller: 'Cave',
        action: 'update'
    },
	
	'DELETE /cave/:id': {
        controller: 'Cave',
        action: 'delete'
    },
	
	/* Author controller */

	'POST /author/': {
        controller: 'Author',
        action: 'create'
    },
	
	'GET /author/:id': {
        controller: 'Author',
        action: 'read'
    },
	
	'PUT /author/:id': {
        controller: 'Author',
        action: 'update'
    },
	
	'DELETE /author/:id': {
        controller: 'Author',
        action: 'delete'
    },
	
	'GET /author/findAll': {
        controller: 'Author',
        action: 'readAll'
    }
};
