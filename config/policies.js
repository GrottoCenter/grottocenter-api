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
  /** *************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions (`true` allows public     *
   * access)                                                                  *
   *                                                                          *
   ************************************************************************** */

  '*': false,

  // Caves
  'v1/cave/*': true,
  'v1/cave/add-document': 'tokenAuth',
  'v1/cave/set-massif': 'tokenAuth',
  'v1/cave/create': 'tokenAuth',
  'v1/cave/delete-one': 'tokenAuth',
  'v1/cave/update': 'tokenAuth',

  // Caver
  'v1/caver/add-explored-entrance': 'tokenAuth',
  'v1/caver/count': true,
  'v1/caver/create': 'tokenAuth',
  'v1/caver/find': true,
  'v1/caver/find-all': false,
  'v1/caver/get-admins': 'tokenAuth',
  'v1/caver/get-moderators': 'tokenAuth',
  'v1/caver/put-on-group': ['tokenAuth', 'adminAuth'],
  'v1/caver/remove-explored-entrance': 'tokenAuth',
  'v1/caver/remove-from-group': ['tokenAuth', 'adminAuth'],
  'v1/caver/set-groups': ['tokenAuth', 'adminAuth'],
  'v1/caver/users-count': true,

  'v1/EntranceController': {
    '*': false,
    addDocument: 'tokenAuth',
    count: true,
    create: 'tokenAuth',
    delete: ['tokenAuth', 'moderatorAuth'],
    find: true,
    findRandom: true,
    publicCount: true,
    unlinkDocument: ['tokenAuth', 'moderatorAuth'],
    update: 'tokenAuth',
    updateWithNewEntities: 'tokenAuth',
    checkRows: 'tokenAuth',
    importRows: 'tokenAuth',
  },

  // Description
  'v1/description/create': 'tokenAuth',
  'v1/description/update': 'tokenAuth',

  'v1/LocationController': {
    create: 'tokenAuth',
    update: 'tokenAuth',
  },

  'v1/NameController': {
    setAsMain: 'tokenAuth',
    update: 'tokenAuth',
  },

  'v1/SearchController': {
    search: true,
    advancedSearch: true,
  },

  PartnerController: {
    '*': true,
  },

  'v1/PartnerController': {
    '*': true,
  },

  // Convert
  'v1/convert/convert': true,

  GrottoController: {
    '*': true,
  },

  RssController: {
    '*': true,
  },

  // Auth
  'v1/auth/login': true,
  'v1/auth/sign-up': true,

  // Subject
  'v1/subject/find': true,
  'v1/subject/find-all': true,
  'v1/subject/search': true,

  // Languages
  'v1/language/find': true,
  'v1/language/find-all': true,

  'v1/DocumentController': {
    '*': true,
    create: 'tokenAuth',
    validate: ['tokenAuth', 'moderatorAuth'],
    multipleValidate: ['tokenAuth', 'moderatorAuth'],
    update: 'tokenAuth',
    updateWithNewEntities: 'tokenAuth',
    checkRows: 'tokenAuth',
    importRows: 'tokenAuth',
  },

  // DocumentType
  'v1/document-type/find': true,
  'v1/document-type/find-all': true,

  // IdentifierType
  'v1/identifier-type/find-all': true,

  'v1/RegionController': {
    '*': true,
  },

  'v1/GrottoController': {
    create: 'tokenAuth',
    count: true,
    delete: ['tokenAuth', 'moderatorAuth'],
    find: ['apiKeyAuth', 'paginate'],
    update: 'tokenAuth',
  },

  'v1/MassifController': {
    create: 'tokenAuth',
    delete: ['tokenAuth', 'moderatorAuth'],
    find: true,
  },

  'v1/GeoLocController': {
    countEntrances: true,
    findEntrances: true,
    findEntrancesCoordinates: true,
    findGrottos: true,
    findNetworks: true,
    findNetworksCoordinates: true,
  },

  // Account
  'v1/account/change-alert-for-news': 'tokenAuth',
  'v1/account/change-email': 'tokenAuth',
  'v1/account/change-password': true,
  'v1/account/forgot-password': true,

  // License
  'v1/license/find-all': true,

  // File format
  'v1/file-format/find-all': true,

  'v1/OptionController': {
    '*': true,
  },

  'v1/SwaggerController': {
    '*': true,
  },
  'v1/DocumentDuplicateController': {
    '*': ['tokenAuth', 'moderatorAuth'],
  },

  'v1/EntranceDuplicateController': {
    '*': ['tokenAuth', 'moderatorAuth'],
  },

  /** *************************************************************************
   *                                                                          *
   * Here's an example of mapping some policies to run before a controller    *
   * and its actions                                                          *
   *                                                                          *
   ************************************************************************** */
  // RabbitController: {

  // Apply the `false` policy as the default for all of RabbitController's actions
  // (`false` prevents all access, which ensures that nothing bad happens to our rabbits)
  // '*': false,

  // For the action `nurture`, apply the 'isRabbitMother' policy
  // (this overrides `false` above)
  // nurture: 'isRabbitMother',

  // Apply the `isNiceToAnimals` AND `hasRabbitFood` policies
  // before letting any users feed our rabbits
  // feed : ['isNiceToAnimals', 'hasRabbitFood']
  // }
};
