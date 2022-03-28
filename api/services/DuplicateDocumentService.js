module.exports = {
  create: async (authorId, content, documentId, datePublication = null) => {
    await TDuplicateDocument.create({
      author: authorId,
      content: content,
      datePublication: datePublication ? datePublication : new Date(),
      document: documentId,
    });
  },
};
