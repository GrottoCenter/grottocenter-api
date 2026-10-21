const BODY_EXCERPT_LENGTH = 50;

/**
 * Human-readable name of a notifiable entity, whatever its type:
 * - `name` (set by NameService.setNames on a cave, entrance, massif or organization),
 * - the first of `names` (TName rows),
 * - `title` (comment, description, location, rigging),
 * - the first of `titles` (document title objects),
 * - an excerpt of `body` (history, which has no title),
 * - the title of the first `descriptions` entry (document).
 *
 * @param {object} entity
 * @returns {string|null} null when nothing usable is found
 */
const getEntityDisplayName = (entity) => {
  if (!entity) return null;
  if (entity.name) return entity.name;
  if (entity.names?.[0]?.name) return entity.names[0].name;
  if (entity.title) return entity.title;
  if (entity.titles?.[0]?.text) return entity.titles[0].text;
  if (entity.body) return `${entity.body.slice(0, BODY_EXCERPT_LENGTH)}...`;
  if (entity.descriptions?.[0]?.title) return entity.descriptions[0].title;
  return null;
};

module.exports = getEntityDisplayName;
