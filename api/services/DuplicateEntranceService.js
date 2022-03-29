module.exports = {
  create: async (
    authorId,
    content,
    entranceId,
    datePublication = new Date(),
  ) => {
    await TDuplicateEntrance.create({
      author: authorId,
      content: content,
      datePublication: datePublication,
      entrance: entranceId,
    });
  },
};
