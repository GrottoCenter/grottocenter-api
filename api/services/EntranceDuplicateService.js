module.exports = {
  create: async (
    authorId,
    content,
    entranceId,
    dateInscription = new Date()
  ) => {
    await TEntranceDuplicate.create({
      author: authorId,
      content,
      dateInscription,
      entrance: entranceId,
    });
  },
};
