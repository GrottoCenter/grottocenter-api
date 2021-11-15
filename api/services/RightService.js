module.exports = {
  /**
   * This helper contains all the words used in the right names in the database.
   * Use them with the check-right helper.
   */
  RightEntities: {
    APPLICATION: 'Application',
    CAVE: 'Cave',
    CAVER: 'Caver',
    DESCRIPTION: 'Description',
    DOCUMENT: 'Document',
    ENTRANCE: 'Entrance',
    ORGANIZATION: 'Organization',
    GROUP: 'Group',
    LOCATION: 'Location',
    MASSIF: 'Massif',
    NAME: 'Name',
    RIGHT: 'Right',
  },

  RightActions: {
    CREATE: 'create',
    DELETE_ANY: 'delete any',
    DELETE_OWN: 'delete own',
    CSV_IMPORT: 'csv import',
    EDIT_ANY: 'edit any',
    EDIT_OWN: 'edit own',
    EDIT_NOT_VALIDATED: 'edit not validated',
    LINK_RESOURCE: 'link resource',
    MERGE_DUPLICATES: 'merge duplicates',
    NO_REQUEST_LIMIT: 'no request limit',
    UNLINK_RESOURCE: 'unlink resource',
    VIEW_ANY: 'view any',
    VIEW_COMPLETE: 'view complete',
    VIEW_LIMITED: 'view limited',
  },
};
