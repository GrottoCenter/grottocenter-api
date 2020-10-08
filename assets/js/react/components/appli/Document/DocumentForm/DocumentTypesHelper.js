export const DocumentTypes = {
  UNKNOWN: 0,
  COLLECTION: 1,
  IMAGE: 4,
  TEXT: 12,
  BOOK: 16,
  ISSUE: 17,
  ARTICLE: 18,
};

export const allDocumentTypes = [
  {
    id: DocumentTypes.COLLECTION,
    name: 'Collection',
    parentId: null,
  },
  {
    id: DocumentTypes.IMAGE,
    name: 'Image',
    parentId: null,
  },
  {
    id: DocumentTypes.TEXT,
    name: 'Text',
    parentId: null,
  },
  {
    id: DocumentTypes.ARTICLE,
    name: 'Article',
    parentId: DocumentTypes.TEXT,
  },
  {
    id: DocumentTypes.ISSUE,
    name: 'Issue',
    parentId: DocumentTypes.TEXT,
  },
  {
    id: DocumentTypes.BOOK,
    name: 'Book',
    parentId: DocumentTypes.TEXT,
  },
];

export const isUnknown = (documentType) => {
  return documentType.id === DocumentTypes.UNKNOWN;
};
export const isCollection = (documentType) => {
  return documentType.id === DocumentTypes.COLLECTION;
};
export const isIssue = (documentType) => {
  return documentType.id === DocumentTypes.ISSUE;
};
export const isArticle = (documentType) => {
  return documentType.id === DocumentTypes.ARTICLE;
};
// Image is also included in "Other" type.
export const isImage = (documentType) => {
  return documentType.id === DocumentTypes.IMAGE;
};
export const isOther = (documentType) => {
  return (
    !isUnknown(documentType) &&
    !isCollection(documentType) &&
    !isIssue(documentType) &&
    !isArticle(documentType)
  );
};
