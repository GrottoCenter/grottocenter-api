module.exports = {
  create: async (authorId, content, entranceId, datePublication = null) => {
    await TDuplicateEntrance.create({
      author: authorId,
      content: content,
      datePublication: datePublication ? datePublication : new Date(),
      entrance: entranceId,
    });
  },
};
