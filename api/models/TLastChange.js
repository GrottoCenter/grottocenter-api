module.exports = {
  tableName: 't_last_change',

  attributes: {
    entityType: {
      type: 'string',
      columnName: 'type_entity',
      maxLength: 30,
    },

    typeChange: {
      type: 'string',
      columnName: 'type_change',
      maxLength: 30,
    },

    dateChange: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'date_change',
    },

    author: {
      columnName: 'id_author',
      model: 'TCaver',
    },

    entityId: {
      type: 'number',
      columnName: 'id_entity',
      columnType: 'int4',
    },

    entityRelatedType: {
      type: 'number',
      columnName: 'type_related_entity',
      columnType: 'int4',
    },

    entityRelatedId: {
      type: 'number',
      columnName: 'id_related_entity',
      columnType: 'int4',
    },

    name: {
      type: 'string',
      columnName: 'name',
      maxLength: 300,
    },
  },
};
