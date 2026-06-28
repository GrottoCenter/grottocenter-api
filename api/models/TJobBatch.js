/**
 * TJobBatch.js
 *
 * @description :: Stores metadata for async job batches (e.g., CSV import).
 */

module.exports = {
  tableName: 't_job_batch',

  primaryKey: 'id',

  attributes: {
    id: {
      type: 'string',
      required: true,
      columnName: 'id',
    },

    type: {
      type: 'string',
      required: true,
      columnName: 'type',
      maxLength: 50,
    },

    status: {
      type: 'string',
      required: true,
      columnName: 'status',
      isIn: ['pending', 'active', 'aggregating', 'completed', 'failed'],
      maxLength: 20,
    },

    initiator: {
      columnName: 'id_initiator',
      model: 'TCaver',
      required: true,
    },

    createdAt: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'created_at',
      autoCreatedAt: true,
    },

    completedAt: {
      type: 'ref',
      columnType: 'timestamp',
      columnName: 'completed_at',
    },

    totalRows: {
      type: 'number',
      required: true,
      columnName: 'total_rows',
    },

    chunkSize: {
      type: 'number',
      required: true,
      columnName: 'chunk_size',
    },

    totalChunks: {
      type: 'number',
      required: true,
      columnName: 'total_chunks',
    },

    result: {
      type: 'json',
      columnName: 'result',
      columnType: 'jsonb',
    },
  },
};
