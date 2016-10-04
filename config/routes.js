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
    view: 'homepage',
    policy: 'localize'
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
    controller: 'Ui',
    view: 'ui/login'
  },

  'POST /ui/validate': {
    controller: 'Ui',
    action: 'validate'
  },

  'GET /ui/cavelist': {
    controller: 'Ui',
    action: 'cavelist'
  },

  'GET /ui/caver/new': {
    controller: 'Ui',
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
    action: 'findAll'
  },

  'GET /entry/:id': {
    controller: 'Entry',
    action: 'findOneById'
  },


  /* REST API for Cave controller */

  'POST /cave/': {
    controller: 'Cave',
    action: 'create'
  },

  'GET /cave/findAll': {
    controller: 'Cave',
    action: 'findAll'
  },

  'GET /cave/findRandom': {
    controller: 'Cave',
    action: 'findRandom'
  },

  'GET /cave/:id': {
    controller: 'Cave',
    action: 'findOneById'
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
  },

  /* REST API for Partner controller */

  'POST /partner/': {
    controller: 'Partner',
    action: 'create'
  },

  'GET /partner/findAll': {
    controller: 'Partner',
    action: 'readAll'
  },

  'GET /partner/findForCarousel': {
    controller: 'Partner',
    action: 'findForCarousel'
  },

  'GET /partner/:id': {
    controller: 'Partner',
    action: 'read'
  },

  'PUT /partner/:id': {
    controller: 'Partner',
    action: 'update'
  },

  'DELETE /partner/:id': {
    controller: 'Partner',
    action: 'delete'
  },

  /* REST API for I18N controller */

  'POST /i18n/translate': {
    controller: 'I18nController',
    action: 'translate'
  }
};
