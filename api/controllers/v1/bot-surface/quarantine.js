const RightService = require('../../../services/RightService');
const BotQuarantineService = require('../../../services/bot/BotQuarantineService');
const readSkipLimit = require('../../../utils/readSkipLimit');

const LANGUAGE_RE = /^[a-z]{3}$/i;

const readFilter = (req, name, allowed) => {
  const value = req.param(name);
  if (value === undefined || value === '') return { value: undefined };
  if (typeof value !== 'string' || !allowed(value)) {
    return { error: `Invalid ${name} filter.` };
  }
  return { value };
};

module.exports = async (req, res) => {
  // Two groups, not a hierarchy: an administrator is not a moderator
  if (!RightService.isModeratorOrAdministrator(req.token.groups)) {
    return res.forbidden(
      'You are not authorized to read the quarantine report.'
    );
  }

  const entityType = readFilter(req, 'entityType', (v) =>
    BotQuarantineService.ENTITY_TYPES.includes(v)
  );
  const patternId = readFilter(req, 'patternId', (v) =>
    BotQuarantineService.PATTERN_IDS.includes(v)
  );
  const language = readFilter(req, 'language', (v) => LANGUAGE_RE.test(v));
  const error = entityType.error || patternId.error || language.error;
  if (error) return res.badRequest(error);

  const report = await BotQuarantineService.report({
    entityType: entityType.value,
    patternId: patternId.value,
    language: language.value?.toLowerCase(),
    ...readSkipLimit(req.param('skip'), req.param('limit')),
  });
  return res.ok(report);
};
