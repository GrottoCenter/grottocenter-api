const esClient = require('../../../config/elasticsearch').elasticsearchCli;

module.exports = {
  friendlyName: 'Author getter',

  description:
    "Get the author associated with the provided name. If he doesn't exist, then create one.",
  extendedDescription:
    'First check if there is an author in the dedicated column. If not, then we take the name of the database from where the data comes from as its author. Then do the checking and create an author if necessary.',
  inputs: {
    data: {
      type: 'ref',
      description: 'Object containing the author information',
      example: 'id',
      required: true,
    },
  },

  exits: {
    success: {
      outputDescription: 'The id of the author.',
    },
  },

  fn: async function(inputs, exits) {
    const doubleCheck = sails.helpers.csvhelpers.doubleCheck.with;
    let authorId;
    let author = doubleCheck({
      data: inputs.data,
      key: 'karstlink:hasDescriptionDocument/dct:creator',
      defaultValue: null,
    });
    let authorName, authorSurname;
    if (!author) {
      author = doubleCheck({
        data: inputs.data,
        key: 'dct:rights/cc:attributionName',
        defaultValue: undefined,
      });
    }

    const [
      authorFullName,
      name,
      surname,
    ] = await sails.helpers.csvhelpers.getPersonData.with({ fullName: author });
    author = authorFullName;
    authorName = name;
    authorSurname = surname;
    const authorCaver = await TCaver.find({
      nickname: author,
    }).limit(1);
    if (authorCaver.length === 0) {
      const caverParams = {
        name: authorName,
        surname: authorSurname,
        nickname: author,
      };
      const newCaver = await CaverService.createNonUserCaver(
        caverParams,
        (error) => error,
        esClient,
      );
      authorId = newCaver.id;
    } else {
      authorId = authorCaver[0].id;
    }
    return exits.success(authorId);
  },
};
