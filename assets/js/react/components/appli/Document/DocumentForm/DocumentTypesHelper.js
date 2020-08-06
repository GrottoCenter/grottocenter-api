export const DocumentTypes = {
  UNKNOWN: 0,
  COLLECTION: 1,
  COLLECTION_ELEMENT: 2,
  IMAGE: 3,
  TEXT: 4,
};

export const allDocumentTypes = [
  {
    id: DocumentTypes.COLLECTION,
    name: 'Collection',
  },
  {
    id: DocumentTypes.COLLECTION_ELEMENT,
    name: 'Collection Element',
  },
  {
    id: DocumentTypes.IMAGE,
    name: 'Image',
  },
  {
    id: DocumentTypes.TEXT,
    name: 'Text / Article',
  },
];

export const isUnknown = (documentType) => {
  return documentType.id === DocumentTypes.UNKNOWN;
};
export const isCollection = (documentType) => {
  return documentType.id === DocumentTypes.COLLECTION;
};
export const isCollectionElement = (documentType) => {
  return documentType.id === DocumentTypes.COLLECTION_ELEMENT;
};
export const isImage = (documentType) => {
  return documentType.id === DocumentTypes.IMAGE;
};
export const isText = (documentType) => {
  return documentType.id === DocumentTypes.TEXT;
};
