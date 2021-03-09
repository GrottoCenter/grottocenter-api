module.exports = {
  /**
   * @param {Object} caves caves to set
   *
   * @returns {Promise} the caves with their attribute "entrances" completed
   */
  setEntrances: async (caves) => {
    return Promise.all(
      caves.map(async (cave) => {
        cave.entrances = await TEntrance.find().where({
          cave: cave.id,
        });
        return cave;
      }),
    );
  },
};
