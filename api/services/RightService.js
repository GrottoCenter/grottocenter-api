module.exports = {
  G: {
    ADMINISTRATOR: 'Administrator',
    MODERATOR: 'Moderator',
    LEADER: 'Leader',
  },

  hasGroup(userGroups, aGroup) {
    return userGroups.some((g) => g.name === aGroup);
  },
};
