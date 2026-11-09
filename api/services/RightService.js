module.exports = {
  G: {
    ADMINISTRATOR: 'Administrator',
    MODERATOR: 'Moderator',
    LEADER: 'Leader',
  },

  hasGroup(userGroups, aGroup) {
    if (!Array.isArray(userGroups)) return false;
    return userGroups.some((g) => g.name === aGroup);
  },

  /**
   * Whether the caller may list and inspect soft-deleted core content
   * (organizations, entrances, massifs, caves, guidelines, documents).
   *
   * Administrators and moderators are the two roles that can delete and
   * restore such content. Roles are not hierarchical, so either one is enough
   * on its own. This grants no other right: the complete view of sensitive
   * locations stays an administrator's (mapping/utils getMetaFromRequest).
   *
   * @param {Array} userGroups req.token?.groups
   * @returns {boolean}
   */
  canViewDeleted(userGroups) {
    return (
      module.exports.hasGroup(userGroups, module.exports.G.ADMINISTRATOR) ||
      module.exports.hasGroup(userGroups, module.exports.G.MODERATOR)
    );
  },
};
