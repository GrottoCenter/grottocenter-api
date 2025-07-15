/**
 * TBibliographicMetadata.js
 *
 * @description :: TBibliographicMetadata model
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

/**
 * enum e_metadata_status
 */
const METADATA_STATUS = {
  REGISTERED: 'registered',
  DELETED: 'deleted',
};

module.exports = {
  tableName: 'v_bibliographic_metadata',
  primaryKey: 'id',

  attributes: {
    id: {
      type: 'number',
      columnName: 'id_document',
      unique: true,
      required: true,
    },

    oaiIdentifier: {
      type: 'string',
      columnName: 'oai_identifier',
      required: true,
      unique: true,
    },

    lastUpdate: {
      type: 'ref',
      columnName: 'last_update',
      columnType: 'timestamp',
      defaultsTo: new Date(),
    },

    listSets: {
      type: 'ref',
      columnName: 'list_sets',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcTitle: {
      type: 'string',
      columnName: 'dc_title',
      allowNull: true,
    },

    dcCreators: {
      type: 'ref',
      columnName: 'dc_creators',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcContributor: {
      type: 'string',
      columnName: 'dc_contributor',
      allowNull: true,
    },

    dcPublisher: {
      type: 'string',
      columnName: 'dc_publisher',
      allowNull: true,
    },

    dcDate: {
      type: 'ref',
      columnName: 'dc_date',
      columnType: 'timestamp',
    },

    dcLanguages: {
      type: 'ref',
      columnName: 'dc_languages',
      columnType: 'bpchar(3)[]',
      defaultsTo: [],
    },

    dcDescriptions: {
      type: 'ref',
      columnName: 'dc_descriptions',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcCoverages: {
      type: 'ref',
      columnName: 'dc_coverages',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcSubjects: {
      type: 'ref',
      columnName: 'dc_subjects',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcFormats: {
      type: 'ref',
      columnName: 'dc_formats',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcIdentifiers: {
      type: 'ref',
      columnName: 'dc_identifiers',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcRelations: {
      type: 'ref',
      columnName: 'dc_relations',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcSources: {
      type: 'ref',
      columnName: 'dc_sources',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcRights: {
      type: 'ref',
      columnName: 'dc_rights',
      columnType: 'text[]',
      defaultsTo: [],
    },

    dcTypeGrottocenter: {
      type: 'string',
      columnName: 'dc_type_grottocenter',
      allowNull: true,
    },

    dcTypeDcmi: {
      type: 'string',
      columnName: 'dc_type_dcmi',
      allowNull: true,
    },

    hasBeenUpdated: {
      type: 'boolean',
      columnName: 'has_been_updated',
      defaultsTo: false,
    },

    metadataStatus: {
      type: 'string',
      columnName: 'metadata_status',
      isIn: Object.values(METADATA_STATUS),
      defaultsTo: 'registered',
    },
  },

  METADATA_STATUS,
};
