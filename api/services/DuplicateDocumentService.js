module.exports = {
  create: async (
    authorId,
    content,
    documentId,
    datePublication = new Date(),
  ) => {
    await TDuplicateDocument.create({
      author: authorId,
      content: content,
      datePublication: datePublication,
      document: documentId,
    });
  },
};
