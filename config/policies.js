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

  // Account
  'v1/account/change-alert-for-news': 'tokenAuth',
  'v1/account/change-email': 'tokenAuth',
  'v1/account/change-password': true,
  'v1/account/forgot-password': true,

  // Auth
  'v1/auth/login': true,
  'v1/auth/sign-up': true,

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
  'v1/caver/get-admins': 'tokenAuth',
  'v1/caver/get-moderators': 'tokenAuth',
  'v1/caver/get-subscriptions': true,
  'v1/caver/put-on-group': ['tokenAuth', 'adminAuth'],
  'v1/caver/remove-explored-entrance': 'tokenAuth',
  'v1/caver/remove-from-group': ['tokenAuth', 'adminAuth'],
  'v1/caver/set-groups': ['tokenAuth', 'adminAuth'],
  'v1/caver/users-count': true,
  'v1/caver/update': 'tokenAuth',

  // Convert
  'v1/convert/convert': true,

  // Description
  'v1/description/create': 'tokenAuth',
  'v1/description/update': 'tokenAuth',

  // Document
  'v1/document/check-rows': 'tokenAuth',
  'v1/document/count': true,
  'v1/document/count-bbs': true,
  'v1/document/create': 'tokenAuth',
  'v1/document/find-all': true,
  'v1/document/find-by-caver-id': true,
  'v1/document/find-children': true,
  'v1/document/find': true,
  'v1/document/import-rows': 'tokenAuth',
  'v1/document/multiple-validate': ['tokenAuth', 'moderatorAuth'],
  'v1/document/update': 'tokenAuth',
  'v1/document/update-with-new-entities': 'tokenAuth',
  'v1/document/validate': ['tokenAuth', 'moderatorAuth'],

  // DocumentDuplicate
  'v1/document-duplicate/create-from-duplicate': ['tokenAuth', 'moderatorAuth'],
  'v1/document-duplicate/create-many': ['tokenAuth', 'moderatorAuth'],
  'v1/document-duplicate/delete-many': ['tokenAuth', 'moderatorAuth'],
  'v1/document-duplicate/delete-one': ['tokenAuth', 'moderatorAuth'],
  'v1/document-duplicate/find': ['tokenAuth', 'moderatorAuth'],
  'v1/document-duplicate/find-all': ['tokenAuth', 'moderatorAuth'],

  // DocumentType
  'v1/document-type/find': true,
  'v1/document-type/find-all': true,

  // Entrance
  'v1/entrance/add-document': 'tokenAuth',
  'v1/entrance/check-rows': 'tokenAuth',
  'v1/entrance/count': true,
  'v1/entrance/create': 'tokenAuth',
  'v1/entrance/delete-one': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance/find': true,
  'v1/entrance/find-random': true,
  'v1/entrance/import-rows': 'tokenAuth',
  'v1/entrance/move-to-cave': 'tokenAuth',
  'v1/entrance/public-count': true,
  'v1/entrance/unlink-document': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance/update': 'tokenAuth',
  'v1/entrance/update-with-new-entities': 'tokenAuth',

  // EntranceDuplicate
  'v1/entrance-duplicate/create-from-duplicate': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance-duplicate/create-many': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance-duplicate/delete-many': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance-duplicate/delete-one': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance-duplicate/find': ['tokenAuth', 'moderatorAuth'],
  'v1/entrance-duplicate/find-all': ['tokenAuth', 'moderatorAuth'],

  // File format
  'v1/file-format/find-all': true,

  // GeoLoc
  'v1/geoloc/count-entrances': true,
  'v1/geoloc/find-entrances': true,
  'v1/geoloc/find-entrances-coordinates': true,
  'v1/geoloc/find-networks': true,
  'v1/geoloc/find-networks-coordinates': true,
  'v1/geoloc/find-organizations': true,

  // IdentifierType
  'v1/identifier-type/find-all': true,

  // Languages
  'v1/language/find': true,
  'v1/language/find-all': true,

  // License
  'v1/license/find-all': true,

  // Location
  'v1/location/create': 'tokenAuth',
  'v1/location/update': 'tokenAuth',

  // History
  'v1/history/create': 'tokenAuth',
  'v1/history/update': 'tokenAuth',

  // Rigging
  'v1/rigging/create': 'tokenAuth',
  'v1/rigging/update': 'tokenAuth',

  // Comment
  'v1/comment/create': 'tokenAuth',
  'v1/comment/update': 'tokenAuth',

  // Country
  'v1/country/find': true,
  'v1/country/subscribe': ['tokenAuth', 'leaderAuth'],
  'v1/country/unsubscribe': ['tokenAuth', 'leaderAuth'],

  // Massif
  'v1/massif/create': 'tokenAuth',
  'v1/massif/subscribe': ['tokenAuth', 'leaderAuth'],
  'v1/massif/unsubscribe': ['tokenAuth', 'leaderAuth'],
  'v1/massif/delete-one': ['tokenAuth', 'moderatorAuth'],
  'v1/massif/find': true,
  'v1/massif/get-statistics': true,
  'v1/massif/update': 'tokenAuth',

  // Name
  'v1/name/set-as-main': 'tokenAuth',
  'v1/name/update': 'tokenAuth',

  // Notification
  'v1/notification/count-unread': 'tokenAuth',
  'v1/notification/find-all': 'tokenAuth',
  'v1/notification/mark-as-read': 'tokenAuth',

  // Option
  'v1/option/find-all': true,

  // Organizations
  'v1/organization/count': true,
  'v1/organization/create': 'tokenAuth',
  'v1/organization/delete-one': ['tokenAuth', 'moderatorAuth'],
  'v1/organization/find': true,
  'v1/organization/find-all': ['apiKeyAuth', 'paginate'],
  'v1/organization/update': 'tokenAuth',

  // Partner
  'v1/partner/count': true,
  'v1/partner/find': true,
  'v1/partner/find-all': true,
  'v1/partner/find-for-carousel': true,

  // Region
  'v1/region/find': true,
  'v1/region/find-all': true,
  'v1/region/search': true,

  // RSS
  'v1/rss/get-feed': true,

  // Search
  'v1/search/quick-search': true,
  'v1/search/advanced-search': true,

  // Subject
  'v1/subject/find': true,
  'v1/subject/find-all': true,
  'v1/subject/search': true,

  // Snapshots
  'v1/comment/get-snapshots': true,
  'v1/description/get-snapshots': true,
  'v1/document/get-snapshots': true,
  'v1/entrance/get-snapshots': true,
  'v1/history/get-snapshots': true,
  'v1/location/get-snapshots': true,
  'v1/rigging/get-snapshots': true,

  // Swagger (API doc)
  'v1/swagger/get-yaml': true,

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
