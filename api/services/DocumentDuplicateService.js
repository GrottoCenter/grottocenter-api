module.exports = {
  create: async (
    authorId,
    content,
    documentId,
    dateInscription = new Date(),
  ) => {
    await TDuplicateDocument.create({
      author: authorId,
      content: content,
      dateInscription: dateInscription,
      document: documentId,
    });
  },
};
