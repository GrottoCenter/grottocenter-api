const RightService = require('../services/RightService');
const readBoolParam = require('./readBoolParam');
const readSkipLimit = require('./readSkipLimit');

/**
 * Read the parameters shared by the core collections that can list their
 * soft-deleted records: `isDeleted`, `skip` and `limit`.
 *
 * `isDeleted` defaults to false (active records only). `isDeleted=true` lists
 * the soft-deleted records only, merged ones included, and is reserved to
 * administrators and moderators (RightService.canViewDeleted). The boolean is
 * validated before the role, so a malformed value is a 400 for everyone.
 *
 * Returns `{ isDeleted, skip, limit }`, or `{ badRequest }` / `{ forbidden }`
 * holding the body of the matching error response:
 *
 *   const params = readDeletedListParams(req, 'entrances');
 *   if (params.badRequest) return res.badRequest(params.badRequest);
 *   if (params.forbidden) return res.forbidden(params.forbidden);
 *
 * @param {object} req Sails request
 * @param {string} entitiesLabel plural label used in the 403 message
 * @returns {{ isDeleted: boolean, skip: number, limit: number }
 *   | { badRequest: object } | { forbidden: string }}
 */
const readDeletedListParams = (req, entitiesLabel) => {
  const { value: isDeleted, error } = readBoolParam(req, 'isDeleted', false);
  if (error) return { badRequest: error };

  if (isDeleted && !RightService.canViewDeleted(req.token?.groups)) {
    return {
      forbidden: `You are not authorized to list deleted ${entitiesLabel}.`,
    };
  }

  return {
    isDeleted,
    ...readSkipLimit(req.param('skip'), req.param('limit')),
  };
};

module.exports = readDeletedListParams;
