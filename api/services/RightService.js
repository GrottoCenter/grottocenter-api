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
};
