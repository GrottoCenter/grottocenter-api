module.exports = {
  friendlyName: 'Format structured error',

  description:
    'Format a structured error object with code, message, and trace ID.',

  sync: true,

  inputs: {
    req: {
      type: 'ref',
      required: true,
      description: 'The request object (to extract traceId).',
    },
    message: {
      type: 'string',
      required: true,
      description: 'The human-readable error message.',
    },
    code: {
      type: 'string',
      required: true,
      description: 'The unique error code.',
    },
    metadata: {
      type: 'ref',
      description: 'Additional metadata for the error.',
      defaultsTo: {},
    },
  },

  fn(inputs) {
    return {
      code: inputs.code,
      message: inputs.message,
      metadata: inputs.metadata,
      reference_id: inputs.req.traceId || 'N/A',
    };
  },
};
