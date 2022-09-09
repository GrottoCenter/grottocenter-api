module.exports = {
  /**
   * This helper contains all the words used in the right names in the database.
   * Use them with the check-right helper.
   */
  RightEntities: {
    APPLICATION: 'Application',
    CAVE: 'Cave',
    CAVER: 'Caver',
    COMMENT: 'Comment',
    COUNTRY: 'Country',
    DESCRIPTION: 'Description',
    DOCUMENT: 'Document',
    DOCUMENT_DUPLICATE: 'Document Duplicate',
    ENTRANCE: 'Entrance',
    ENTRANCE_DUPLICATE: 'Entrance Duplicate',
    GROUP: 'Group',
    HISTORY: 'History',
    LOCATION: 'Location',
    MASSIF: 'Massif',
    NAME: 'Name',
    ORGANIZATION: 'Organization',
    RIGGING: 'Rigging',
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
    MARK_AS_SENSITIVE: 'mark as sensitive',
    MERGE: 'merge',
    MERGE_DUPLICATES: 'merge duplicates',
    NO_REQUEST_LIMIT: 'no request limit',
    NO_MODERATOR_DELETE_REQUEST_LIMIT: 'no moderator delete request limit',
    NO_USER_DELETE_REQUEST_LIMIT: 'no user delete request limit',
    SUBSCRIBE: 'subscribe',
    UNLINK_RESOURCE: 'unlink resource',
    UNMARK_AS_SENSITIVE: 'unmark as sensitive',
    VIEW_ANY: 'view any',
    VIEW_COMPLETE: 'view complete',
    VIEW_LIMITED: 'view limited',
  },
};
