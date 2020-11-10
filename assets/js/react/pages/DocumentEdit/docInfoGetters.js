import { head, omit, pathOr, pipe, propOr } from 'ramda';

const docInfoGetters = {
  getAndConvertParentDocument: (fullDocument) => {
    const parent = pathOr(null, ['parent'], fullDocument);
    if (parent) {
      return {
        // Convert parent "type" to "documentType" and get name from "titles"
        documentType: {
          id: propOr(null, 'type', parent),
        },
        name: pipe(
          propOr([], ['titles']),
          head,
          propOr(null, ['text']),
        )(parent),
        ...omit(['type', 'titles'], parent),
      };
    }
    return parent;
  },

  getStartPage: (fullDocument) => {
    const { pages } = fullDocument;
    if (!pages) {
      return null;
    }
    const result = pages.split(/[-,]/)[0];
    if (result === '') {
      return null;
    }
    return Number(result);
  },

  getEndPage: (fullDocument) => {
    const { pages } = fullDocument;
    if (!pages) {
      return null;
    }
    const result = pages.split(/[-,]/)[1];
    if (result === '' || !result) {
      return null;
    }
    return Number(result);
  },
};

export default docInfoGetters;
