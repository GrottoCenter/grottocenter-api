module.exports = {
  create: async (authorId, content, entranceId, date = null) => {
    await TDuplicateEntrance.create({
      author: authorId,
      content: content,
      date: date ? date : new Date(),
      entrance: entranceId,
    });
  },
};
