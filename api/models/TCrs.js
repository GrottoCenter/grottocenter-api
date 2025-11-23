module.exports = {
  tableName: 't_crs',
  attributes: {
    id: {
      type: 'number',
      columnName: 'id',
      autoIncrement: true,
      unique: true,
    },
    author: {
      model: 'TCaver',
      columnName: 'id_author',
    },
    reviewer: {
      model: 'TCaver',
      columnName: 'id_reviewer',
    },
    dateInscription: {
      type: 'ref',
      columnType: 'timestamptz',
      columnName: 'date_inscription',
      autoCreatedAt: false,
    },
    dateReviewed: {
      type: 'ref',
      columnType: 'timestamptz',
      columnName: 'date_reviewed',
    },
    definition: {
      type: 'string',
      columnName: 'definition',
    },
    bounds: {
      type: 'string',
      columnName: 'bounds',
      allowNull: true,
    },
    url: {
      type: 'string',
      columnName: 'url',
      allowNull: true,
    },
    enabled: {
      type: 'boolean',
      columnName: 'enabled',
      defaultsTo: true,
    },
    code: {
      type: 'string',
      columnName: 'code',
    },
  },
};
