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

  '*': false, // by default, prevents all access

  // Account
  'v1/account/find': 'tokenAuth',
  'v1/account/update': 'tokenAuth',
  'v1/account/change-password': true,
  'v1/account/forgot-password': true,
  'v1/account/get-notifications': 'tokenAuth',
  'v1/account/update-notifications': 'tokenAuth',

  // Auth
  'v1/auth/login': true,
  'v1/auth/sign-up': true,
  'v1/auth/verify-email': true,
  'v1/auth/resend-verification-email': true,

  // MFA
  'v1/mfa/enroll': ['mfaEnrollmentAuth'],
  'v1/mfa/verify': ['mfaEnrollmentAuth'],
  'v1/mfa/reset': ['tokenAuth'],

  // Caves
  'v1/cave/find': ['validateId'],
  'v1/cave/find-all': true,
  'v1/cave/cumulated-length': true,
  'v1/cave/add-document': 'tokenAuth',
  'v1/cave/unlink-document': 'tokenAuth',
  'v1/cave/create': 'tokenAuth',
  'v1/cave/delete': 'tokenAuth',
  'v1/cave/update': 'tokenAuth',
  'v1/cave/restore': 'tokenAuth',
  'v1/organization/add-explored-cave': 'tokenAuth',
  'v1/organization/remove-explored-cave': 'tokenAuth',

  // Caver
  'v1/caver/get-banned': 'tokenAuth',
  'v1/caver/get-invalid-mail': 'tokenAuth',
  'v1/caver/count': true,
  'v1/caver/users-count': true,
  'v1/caver/find': ['validateId'],
  'v1/caver/get-subscriptions': ['validateId'],
  'v1/caver/add-explored-entrance': 'tokenAuth',
  'v1/caver/create': 'tokenAuth',
  'v1/caver/get-groups': 'tokenAuth',
  'v1/caver/get-admins': 'tokenAuth',
  'v1/caver/get-moderators': 'tokenAuth',
  'v1/caver/get-authors': 'tokenAuth',
  'v1/caver/get-contributors': 'tokenAuth',
  'v1/caver/get-users': 'tokenAuth',
  'v1/caver/put-on-group': 'tokenAuth',
  'v1/caver/remove-explored-entrance': 'tokenAuth',
  'v1/caver/ban': 'tokenAuth',
  'v1/caver/unban': 'tokenAuth',
  'v1/caver/remove-from-group': 'tokenAuth',
  'v1/caver/set-groups': 'tokenAuth',
  'v1/caver/add-to-organization': 'tokenAuth',
  'v1/caver/remove-from-organization': 'tokenAuth',
  'v1/caver/update': 'tokenAuth',
  'v1/caver/get-db-export': 'tokenAuth',
  'v1/caver/delete': 'tokenAuth',

  // Description
  'v1/description/get-snapshots': true,
  'v1/description/create': 'tokenAuth',
  'v1/description/update': 'tokenAuth',
  'v1/description/delete': 'tokenAuth',
  'v1/description/restore': 'tokenAuth',
  'v1/description/move-relevance': ['validateId', 'tokenAuth'],

  // Document
  'v1/document/count': true,
  'v1/document/count-bbs': true,
  'v1/document/find-all': true,
  'v1/document/find-by-caver-id': true,
  'v1/document/find-children': true,
  'v1/document/find': ['validateId'],
  'v1/document/get-snapshots': true,
  'v1/document/check-rows': 'tokenAuth',
  'v1/document/create': 'tokenAuth',
  'v1/document/import-rows': 'tokenAuth',
  'v1/document/multiple-validate': 'tokenAuth',
  'v1/document/update': 'tokenAuth',
  'v1/document/update-with-new-entities': 'tokenAuth',
  'v1/document/validate': 'tokenAuth',
  'v1/document/delete': 'tokenAuth',
  'v1/document/restore': 'tokenAuth',

  // Bibliographic Metadata
  'v1/bibliographic-metadata/search': true,

  // DocumentDuplicate
  'v1/document-duplicate/create-from-duplicate': 'tokenAuth',
  'v1/document-duplicate/create-many': 'tokenAuth',
  'v1/document-duplicate/delete-many': 'tokenAuth',
  'v1/document-duplicate/delete-one': 'tokenAuth',
  'v1/document-duplicate/find': ['validateId', 'tokenAuth'],
  'v1/document-duplicate/find-all': 'tokenAuth',

  // DocumentType
  'v1/document-type/find': true,
  'v1/document-type/find-all': true,

  // Bibliographic Metadata (Record)
  'v1/bibliographic-metadata/get-record-format': true,
  'v1/bibliographic-metadata/get-sets': true,
  'v1/bibliographic-metadata/get-record': true,
  'v1/bibliographic-metadata/get-records': true,
  'v1/bibliographic-metadata/get-identifiers': true,
  'v1/bibliographic-metadata/count': true,
  'v1/bibliographic-metadata/get-identifiers-paginated': true,
  'v1/bibliographic-metadata/get-records-paginated': true,

  // Entrance
  'v1/entrance/count': true,
  'v1/entrance/public-count': true,
  'v1/entrance/find': ['validateId'],
  'v1/entrance/find-random': true,
  'v1/entrance/get-snapshots': true,
  'v1/entrance/get-all-snapshots': true,
  'v1/entrance/add-document': 'tokenAuth',
  'v1/entrance/check-rows': 'tokenAuth',
  'v1/entrance/create': 'tokenAuth',
  'v1/entrance/import-rows': 'tokenAuth',
  'v1/entrance/move-to-cave': 'tokenAuth',
  'v1/entrance/unlink-document': 'tokenAuth',
  'v1/entrance/update': 'tokenAuth',
  'v1/entrance/update-with-new-entities': 'tokenAuth',
  'v1/entrance/restore': 'tokenAuth',
  'v1/entrance/delete': 'tokenAuth',

  // EntranceDuplicate
  'v1/entrance-duplicate/create-from-duplicate': 'tokenAuth',
  'v1/entrance-duplicate/create-many': 'tokenAuth',
  'v1/entrance-duplicate/delete-many': 'tokenAuth',
  'v1/entrance-duplicate/delete-one': 'tokenAuth',
  'v1/entrance-duplicate/find': ['validateId', 'tokenAuth'],
  'v1/entrance-duplicate/find-all': 'tokenAuth',

  // GeoLoc
  'v1/geoloc/count-entrances': true,
  'v1/geoloc/find-entrances': true,
  'v1/geoloc/find-entrances-coordinates': true,
  'v1/geoloc/find-networks': true,
  'v1/geoloc/find-networks-coordinates': true,
  'v1/geoloc/find-massifs': true,
  'v1/geoloc/find-massifs-coordinates': true,
  'v1/geoloc/find-organizations': true,

  // Languages
  'v1/language/find': true,
  'v1/language/find-all': true,

  // Location
  'v1/location/get-snapshots': true,
  'v1/location/create': 'tokenAuth',
  'v1/location/update': 'tokenAuth',
  'v1/location/delete': 'tokenAuth',
  'v1/location/restore': 'tokenAuth',
  'v1/location/move-relevance': ['validateId', 'tokenAuth'],

  // History
  'v1/history/get-snapshots': true,
  'v1/history/create': 'tokenAuth',
  'v1/history/update': 'tokenAuth',
  'v1/history/delete': 'tokenAuth',
  'v1/history/restore': 'tokenAuth',
  'v1/history/move-relevance': ['validateId', 'tokenAuth'],

  // Guideline
  'v1/guideline/find-all': true,
  'v1/guideline/create': 'tokenAuth',
  'v1/guideline/update': ['validateId', 'tokenAuth'],
  'v1/guideline/delete': ['validateId', 'tokenAuth'],
  'v1/guideline/restore': ['validateId', 'tokenAuth'],
  // No validateId: the :snapshotId route param is an ISO date string, not an
  // integer, so validateId would reject every valid rollback request.
  'v1/guideline/rollback': 'tokenAuth',
  'v1/guideline/find-for-entity': true,
  // Public, matching every other entity's get-snapshots and the public guideline
  // reads above. The controller validates the :id itself, so no validateId here.
  'v1/guideline/get-snapshots': true,

  // Rigging
  'v1/rigging/get-snapshots': true,
  'v1/rigging/create': 'tokenAuth',
  'v1/rigging/update': 'tokenAuth',
  'v1/rigging/delete': 'tokenAuth',
  'v1/rigging/restore': 'tokenAuth',
  'v1/rigging/move-relevance': ['validateId', 'tokenAuth'],

  // Comment
  'v1/comment/get-snapshots': true,
  'v1/comment/create': 'tokenAuth',
  'v1/comment/update': 'tokenAuth',
  'v1/comment/delete': 'tokenAuth',
  'v1/comment/restore': 'tokenAuth',
  'v1/comment/move-relevance': ['validateId', 'tokenAuth'],

  // Country
  'v1/country/count': true,
  'v1/country/find': true,
  'v1/country/get-statistics': true,
  'v1/country/get-entrances-data-quality': true,
  'v1/country/subscribe': 'tokenAuth',
  'v1/country/unsubscribe': 'tokenAuth',
  'v1/country/set-organization': ['tokenAuth', 'validateId'],
  'v1/country/remove-organization': ['tokenAuth', 'validateId'],

  // Massif
  'v1/massif/count': true,
  'v1/massif/find': ['validateId'],
  'v1/massif/get-statistics': true,
  'v1/massif/get-entrances-data-quality': true,
  'v1/massif/update': 'tokenAuth',
  'v1/massif/create': 'tokenAuth',
  'v1/massif/subscribe': 'tokenAuth',
  'v1/massif/unsubscribe': 'tokenAuth',
  'v1/massif/delete': 'tokenAuth',
  'v1/massif/restore': 'tokenAuth',
  'v1/massif/mark-sensitive': 'tokenAuth',
  'v1/massif/unmark-sensitive': 'tokenAuth',
  'v1/massif/preview-sensitive': 'tokenAuth',
  'v1/massif/add-document': 'tokenAuth',
  'v1/massif/unlink-document': 'tokenAuth',
  'v1/massif/set-organization': ['tokenAuth', 'validateId'],
  'v1/massif/remove-organization': ['tokenAuth', 'validateId'],

  // Name
  'v1/name/set-as-main': 'tokenAuth',
  'v1/name/update': 'tokenAuth',

  // Messages
  'v1/message/create': 'tokenAuth',
  'v1/message/list-conversations': 'tokenAuth',
  'v1/message/list-archived-conversations': 'tokenAuth',
  'v1/message/get-messages': 'tokenAuth',
  'v1/message/archive': 'tokenAuth',
  'v1/message/unarchive': 'tokenAuth',
  'v1/message/count-unread': 'tokenAuth',

  // Notification
  'v1/notification/count-unread': 'tokenAuth',
  'v1/notification/find-all': 'tokenAuth',
  'v1/notification/mark-as-read': 'tokenAuth',
  'v1/notification/mark-as-read-batch': 'tokenAuth',

  // Organizations
  'v1/organization/count': true,
  'v1/organization/find': ['validateId'],
  'v1/organization/find-all': true,
  'v1/organization/create': 'tokenAuth',
  'v1/organization/delete': 'tokenAuth',
  'v1/organization/restore': 'tokenAuth',
  'v1/organization/update': 'tokenAuth',

  // Device
  'v1/device/find': ['validateId'],
  'v1/device/search': true,
  'v1/device/create': 'tokenAuth',
  'v1/device/update': ['validateId', 'tokenAuth'],
  'v1/device/delete': ['validateId', 'tokenAuth'],
  'v1/device/restore': ['validateId', 'tokenAuth'],

  // Sensor Configuration
  'v1/sensor-configuration/find': ['validateId'],
  'v1/sensor-configuration/create': ['validateId', 'tokenAuth'],
  'v1/sensor-configuration/update': ['validateId', 'tokenAuth'],
  'v1/sensor-configuration/delete': ['validateId', 'tokenAuth'],
  'v1/sensor-configuration/restore': ['validateId', 'tokenAuth'],

  // Partner
  'v1/partner/count': true,
  'v1/partner/find-for-carousel': true,

  // Region
  'v1/region/find': true,
  'v1/region/find-all': true,
  'v1/region/search': true,
  'v1/region/find-by-country': true,
  'v1/region/count': true,
  'v1/region/get-statistics': true,
  'v1/region/get-entrances-data-quality': true,
  'v1/region/subscribe': 'tokenAuth',
  'v1/region/unsubscribe': 'tokenAuth',
  'v1/region/set-organization': ['tokenAuth', 'validateId'],
  'v1/region/remove-organization': ['tokenAuth', 'validateId'],

  // Search
  'v1/search/quick-search': true,
  'v1/search/advanced-search': true,
  'v1/search/advanced-search-export': true,
  'v1/search/field-search': true,

  // Subject
  'v1/subject/find': true,
  'v1/subject/find-all': true,
  'v1/subject/search': true,

  // Substance
  'v1/substance/find': true,
  'v1/substance/create': 'tokenAuth',

  // SSO
  'v1/sso/auth-token': 'tokenAuth',

  // Job (async batch operations)
  'v1/job/find': 'tokenAuth',

  // Miscellaneous
  'v1/convert/convert': true,
  'v1/file-format/find-all': true,
  'v1/identifier-type/find-all': true,
  'v1/license/find-all': true,
  'v1/option/find-all': true,
  'v1/rss/get-feed': true,
  'v1/swagger/get-yaml': true,
  'v1/change/get-recent': true,

  // Health check
  'v1/health/check': true,

  // Observation
  'v1/observation/import': 'tokenAuth',

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
