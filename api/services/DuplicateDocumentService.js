module.exports = {
  create: async (authorId, content, documentId, date = null) => {
    await TDuplicateDocument.create({
      author: authorId,
      content: content,
      date: date ? date : new Date(),
      document: documentId,
    });
  },
};
