module.exports = {
  create: async (
    authorId,
    content,
    entranceId,
    dateInscription = new Date(),
  ) => {
    await TEntranceDuplicate.create({
      author: authorId,
      content: content,
      dateInscription: dateInscription,
      entrance: entranceId,
    });
  },
};
