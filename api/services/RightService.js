module.exports = {
  /**
   * This helper contains all the words used in the right names in the database.
   * Use them with the check-right helper.
   */
  RightEntities: {
    APPLICATION: 'Application',
    CAVE: 'Cave',
    CAVER: 'Caver',
    DOCUMENT: 'Document',
    ENTRANCE: 'Entrance',
    ORGANIZATION: 'Organization',
    GROUP: 'Group',
    MASSIF: 'Massif',
    RIGHT: 'Right',
  },

  RightActions: {
    CREATE: 'create',
    DELETE_ANY: 'delete any',
    DELETE_OWN: 'delete own',
    EDIT_ANY: 'edit any',
    EDIT_OWN: 'edit own',
    LINK_RESOURCE: 'link resource',
    MERGE_DUPLICATES: 'merge duplicates',
    UNLINK_RESOURCE: 'unlink resource',
    VIEW_ANY: 'view any',
    VIEW_COMPLETE: 'view complete',
    VIEW_LIMITED: 'view limited',
  },
};
