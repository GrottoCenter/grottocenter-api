/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run ** before ** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file(e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http: //sailsjs.org/#/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http: //sailsjs.org/#/documentation/reference/sails.config/sails.config.policies.html
 */

module.exports.policies = {
  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions (`true` allows public     *
   * access)                                                                  *
   *                                                                          *
   ***************************************************************************/

  '*': false,

  IndexController: {
    '*': false,
    index: 'localize',
  },

  AuthController: {
    login: true,
    logout: 'tokenAuth',
  },

  CaverController: {
    '*': false,
    getCaversNumber: true,
    putOnGroup: ['tokenAuth', 'adminAuth'],
    removeFromGroup: ['tokenAuth', 'adminAuth'],
    setGroups: ['tokenAuth', 'adminAuth'],
    getAdmins: 'tokenAuth',
    getModerators: 'tokenAuth',
  },

  EntranceController: {
    '*': 'tokenAuth',
    find: 'apiKeyAuth',
    findAll: true,
    findRandom: true,
    getPublicEntrancesNumber: 'apiKeyAuth',
    getEntrancesNumber: true,
  },

  'v1/EntranceController': {
    '*': false,
    find: 'apiKeyAuth',
    findAll: ['apiKeyAuth', 'paginate'],
    getPublicEntrancesNumber: 'apiKeyAuth',
  },

  SearchController: {
    findAll: 'apiKeyAuth',
  },

  'v1/SearchController': {
    search: true,
    advancedSearch: true,
    findAll: ['apiKeyAuth', 'paginate'],
  },

  CaveController: {
    '*': true,
  },

  AuthorController: {
    '*': false,
  },

  PartnerController: {
    '*': true,
  },

  I18nController: {
    '*': true,
  },

  SwaggerController: {
    '*': true,
  },

  TopographyController: {
    '*': false,
  },

  ConvertController: {
    '*': true,
  },

  CommentController: {
    '*': false,
  },

  GrottoController: {
    '*': true,
  },

  AdminController: {
    '*': true,
  },

  RssController: {
    '*': true,
  },

  MassifController: {
    '*': true,
  },

  'v1/AuthController': {
    '*': true,
  },

  'v1/BbsGeoController': {
    '*': true,
  },

  'v1/SubjectController': {
    '*': true,
  },

  'v1/LanguageController': {
    '*': true,
  },

  'v1/DocumentController': {
    '*': true,
    create: 'tokenAuth',
    validate: ['tokenAuth', 'moderatorAuth'],
    multipleValidate: ['tokenAuth', 'moderatorAuth'],
  },

  'v1/DocumentTypeController': {
    '*': true,
  },

  'v1/IdentifierTypeController': {
    '*': true,
  },

  'v1/RegionController': {
    '*': true,
  },

  'v1/GrottoController': {
    find: ['apiKeyAuth', 'paginate'],
  },

  'v1/MassifController': {
    find: ['apiKeyAuth', 'paginate'],
  },

  'v1/GeoLocController': {
    countEntries: true,
    findByBounds: true,
  },

  /***************************************************************************
   *                                                                          *
   * Here's an example of mapping some policies to run before a controller    *
   * and its actions                                                          *
   *                                                                          *
   ***************************************************************************/
  // RabbitController: {

  // Apply the `false` policy as the default for all of RabbitController's actions
  // (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
  // '*': false,

  // For the action `nurture`, apply the 'isRabbitMother' policy
  // (this overrides `false` above)
  // nurture	: 'isRabbitMother',

  // Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
  // before letting any users feed our rabbits
  // feed : ['isNiceToAnimals', 'hasRabbitFood']
  // }
};
