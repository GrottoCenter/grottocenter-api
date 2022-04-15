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

  /** *************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` (or `views/homepage.jade`, *
   * etc. depending on your default view engine) your home page.              *
   *                                                                          *
   * (Alternatively, remove this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ************************************************************************** */

  /** *************************************************************************
   *                                                                          *
   * Custom routes here...                                                    *
   *                                                                          *
   *  If a request to a URL doesn't match any of the custom routes above, it  *
   * is matched against Sails route blueprints. See `config/blueprints.js`    *
   * for configuration options and examples.                                  *
   *                                                                          *
   ************************************************************************** */

  // CSRF
  'GET /csrfToken': {
    action: 'security/grant-csrf-token',
  },

  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝

  // Swagger (API doc)
  'GET /api/v1/swagger.yaml': 'v1/swagger/get-yaml',

  // Account
  'PATCH /api/v1/account/password': 'v1/account/change-password',
  'PATCH /api/v1/account/alertForNews': 'v1/account/change-alert-for-news',
  'PATCH /api/v1/account/email': 'v1/account/change-email',
  'POST /api/v1/forgotPassword': 'v1/account/forgot-password',

  // Auth
  'POST /api/v1/login': 'v1/auth/login',
  'POST /api/v1/signup': 'v1/auth/sign-up',

  // Caver
  'DELETE /api/v1/cavers/:caverId/entrances/:entranceId':
    'v1/caver/remove-explored-entrance',
  'DELETE /api/v1/cavers/:caverId/groups/:groupId':
    'v1/caver/remove-from-group',
  'GET /api/v1/cavers': 'v1/caver/find-all',
  'GET /api/v1/cavers/:id': 'v1/caver/find',
  'GET /api/v1/cavers/:caverId/documents': 'v1/document/find-by-caver-id',
  'GET /api/v1/cavers/admins': 'v1/caver/get-admins',
  'GET /api/v1/cavers/count': 'v1/caver/count',
  'GET /api/v1/cavers/moderators': 'v1/caver/get-moderators',
  'GET /api/v1/cavers/users/count': 'v1/caver/users-count',
  'POST /api/v1/cavers/': 'v1/caver/create',
  'POST /api/v1/cavers/:caverId/groups': 'v1/caver/set-groups',
  'PUT /api/v1/cavers/:caverId/entrances/:entranceId':
    'v1/caver/add-explored-entrance',
  'PUT /api/v1/cavers/:caverId/groups/:groupId': 'v1/caver/put-on-group',

  /**
   * @deprecated use api/v1/cavers instead
   */
  'GET /api/v1/cavers/findAll': 'v1/caver/find-all',

  // Entrance
  'DELETE /api/v1/entrances/:id': 'v1/entrance/delete-one',
  'DELETE /api/v1/entrances/:entranceId/documents/:documentId':
    'v1/entrance/unlink-document',
  'GET /api/v1/entrances/count': 'v1/entrance/count',
  'GET /api/v1/entrances/findRandom': 'v1/entrance/find-random',
  'GET /api/v1/entrances/publicCount': 'v1/entrance/public-count',
  'GET /api/v1/entrances/:id': 'v1/entrance/find',
  'POST /api/v1/entrances': 'v1/entrance/create',
  'POST /api/v1/entrances/check-rows': 'v1/entrance/check-rows',
  'POST /api/v1/entrances/import-rows': 'v1/entrance/import-rows',
  'PUT /api/v1/entrances/:id': 'v1/entrance/update',
  'PUT /api/v1/entrances/:id/new-entities':
    'v1/entrance/update-with-new-entities',
  'PUT /api/v1/entrances/:entranceId/documents/:documentId':
    'v1/entrance/add-document',

  // Cave
  'DELETE /api/v1/caves/:id': 'v1/cave/delete-one',
  'GET /api/v1/caves/:id': 'v1/cave/find',
  'GET /api/v1/caves': 'v1/cave/find-all',
  'POST /api/v1/caves': 'v1/cave/create',
  'PUT /api/v1/caves/:caveId/documents/:documentId': 'v1/cave/add-document',
  'PUT /api/v1/caves/:id': 'v1/cave/update',
  'PUT /api/v1/caves/:caveId/massif/:massifId': 'v1/cave/set-massif',
  /**
   * @deprecated use api/v1/caves instead
   */
  'GET /api/v1/caves/findAll': 'v1/cave/find-all',

  // Partner
  'GET /api/v1/partners/:id': 'v1/partner/find',
  'GET /api/v1/partners/count': 'v1/partner/count',
  'GET /api/v1/partners/findAll': 'v1/partner/find-all',
  'GET /api/v1/partners/findForCarousel': 'v1/partner/find-for-carousel',
  'GET /api/v1/partners/findForCarousel/:skip/:limit':
    'v1/partner/find-for-carousel',

  /**
   * @deprecated use api/v1/partners instead
   */
  'GET /api/partners/:id': 'v1/partner/find',
  'GET /api/partners/findAll': 'v1/partner/find-all',
  'GET /api/partners/findForCarousel/:skip/:limit':
    'v1/partner/find-for-carousel',

  // Comment
  'GET /api/v1/comments/stats/:entranceId': 'v1/comment/get-entrance-stats',
  'GET /api/v1/comments/timeinfos/:entranceId':
    'v1/comment/get-entrance-time-infos',

  /**
   * @deprecated use /v1 routes above instead
   */
  'GET /api/comments/stats/:entry': 'v1/comment/get-entrance-stats',
  'GET /api/comments/timeinfos/:entry': 'v1/comment/get-entrance-time-infos',

  // Organization
  'DELETE /api/v1/organizations/:id': 'v1/organization/delete-one',
  'GET /api/v1/organizations/count': 'v1/organization/count',
  'GET /api/v1/organizations/:id': 'v1/organization/find',
  'GET /api/v1//organizations': 'v1/organization/find-all',
  'POST /api/v1/organizations': 'v1/organization/create',
  'PUT /api/v1/organizations/:id': 'v1/organization/update',

  /**
   * @deprecated use /v1/organizations route above instead
   */
  'GET /api/organizations/findAll': 'v1/organization/find-all',

  // Massif
  'DELETE /api/v1/massifs/:id': 'v1/massif/delete-one',
  'GET /api/v1/massifs/:id': 'v1/massif/find',
  'POST /api/v1/massifs': 'v1/massif/create',

  // Document
  'GET /api/v1/documents': 'v1/document/find-all',
  'GET /api/v1/documents/:id': 'v1/document/find',
  'GET /api/v1/documents/:id/children': 'v1/document/find-children',
  'GET /api/v1/documents/count': 'v1/document/count',
  'POST /api/v1/documents': 'v1/document/create',
  'POST /api/v1/documents/check-rows': 'v1/document/check-rows',
  'POST /api/v1/documents/import-rows': 'v1/document/import-rows',
  'PUT /api/v1/documents/:id': 'v1/document/update',
  'PUT /api/v1/documents/:id/new-entities':
    'v1/document/update-with-new-entities',
  'PUT /api/v1/documents/:id/validate': 'v1/document/validate',
  'PUT /api/v1/documents/validate': 'v1/document/multiple-validate',

  // Document Type
  'GET /api/v1/documents/types': 'v1/document-type/find-all',
  'GET /api/v1/documents/types/:id': 'v1/document-type/find',

  // Description
  'PATCH /api/v1/descriptions/:id': 'v1/description/update',
  'POST /api/v1/descriptions': 'v1/description/create',

  // Name
  'PATCH /api/v1/names/:id': 'v1/name/update',
  'POST /api/v1/names/:id/setAsMain': 'v1/name/set-as-main',

  // Location
  'POST /api/v1/locations': 'v1/location/create',
  'PUT /api/v1/locations/:id': 'v1/location/update',

  // Document Subject
  'GET /api/v1/documents/subjects': 'v1/subject/find-all',
  'GET /api/v1/documents/subjects/:code': {
    action: 'v1/subject/find',
    skipAssets: false, // Disable this parameter to allow a dot in the url (for the code)
  },
  'POST /api/v1/documents/subjects/search/logical/or': 'v1/subject/search',

  // Document Identifier Types
  'GET /api/v1/documents/identifierTypes': 'v1/identifier-type/find-all',

  // Region
  'POST /api/v1/regions/search/logical/or': 'v1/region/search',

  // Rss
  'GET /api/v1/rss/:language': 'v1/rss/get-feed',
  /**
   * @deprecated use /v1 route above instead
   */
  'GET /api/rss/:language': 'v1/rss/get-feed',

  // Geo localisation
  'GET /api/v1/geoloc/countEntrances': 'v1/geoloc/count-entrances',
  'GET /api/v1/geoloc/entrances': 'v1/geoloc/find-entrances',
  'GET /api/v1/geoloc/entrancesCoordinates':
    'v1/geoloc/find-entrances-coordinates',
  'GET /api/v1/geoloc/networks': 'v1/geoloc/find-networks',
  'GET /api/v1/geoloc/networksCoordinates':
    'v1/geoloc/find-networks-coordinates',
  'GET /api/v1/geoloc/organizations': 'v1/geoloc/find-organizations',

  /**
   * @deprecated use geoloc/countEntrances instead
   */
  'GET /api/v1/geoloc/countEntries': 'v1/geoloc/count-entrances',
  /**
   * @deprecated use geoloc/organizations instead
   */
  'GET /api/v1/geoloc/grottos': 'v1/geoloc/find-organizations',
  /**
   * @deprecated use geoloc/networks instead
   */
  'GET /api/v1/geoloc/caves': 'v1/geoloc/find-networks',
  /**
   * @deprecated use geoloc/networksCoordinates instead
   */
  'GET /api/v1/geoloc/cavesCoordinates': 'v1/geoloc/find-networks-coordinates',

  // Search
  'POST /api/v1/search': 'v1/search/quick-search',
  'POST /api/v1/advanced-search': 'v1/search/advanced-search',

  // Language
  'GET /api/v1/languages/:id': 'v1/language/find',
  'GET /api/v1/languages': 'v1/language/find-all',

  // Convert
  'GET /api/v1/convert': 'v1/convert/convert',
  /**
   * @deprecated use /v1 route above instead
   */
  'GET /api/convert': 'v1/convert/convert',

  // License
  'GET /api/v1/licenses': 'v1/license/find-all',

  // File formats
  'GET /api/v1/file-formats': 'v1/file-format/find-all',

  // Option
  'GET /api/v1/options': 'v1/option/find-all',

  // DocumentDuplicate
  'DELETE /api/v1/document-duplicates': 'v1/document-duplicate/delete-many',
  'DELETE /api/v1/document-duplicates/:id': 'v1/document-duplicate/delete-one',
  'GET /api/v1/document-duplicates': 'v1/document-duplicate/find-all',
  'GET /api/v1/document-duplicates/:id': 'v1/document-duplicate/find',
  'POST /api/v1/documents/from-duplicate/:id':
    'v1/document-duplicate/create-from-duplicate',

  // EntranceDuplicate
  'DELETE /api/v1/entrance-duplicates': 'v1/entrance-duplicate/delete-many',
  'DELETE /api/v1/entrance-duplicates/:id': 'v1/entrance-duplicate/delete-one',
  'GET /api/v1/entrance-duplicates': 'v1/entrance-duplicate/find-all',
  'GET /api/v1/entrance-duplicates/:id': 'v1/entrance-duplicate/find',
  'POST /api/v1/entrances/from-duplicate/:id':
    'v1/entrance-duplicate/create-from-duplicate',

  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝

  //  ╔╦╗╦╔═╗╔═╗
  //  ║║║║╚═╗║
  //  ╩ ╩╩╚═╝╚═╝
};
