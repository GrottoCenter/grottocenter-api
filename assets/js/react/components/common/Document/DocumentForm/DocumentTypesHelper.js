export const allDocumentTypes = [
  {
    id: '1',
    name: 'Collection',
  },
  {
    id: '2',
    name: 'Collection Element',
  },
  {
    id: '3',
    name: 'Image',
  },
  {
    id: '4',
    name: 'Text / Article',
  },
];

export const isCollection = (documentType) => {
  return documentType.id === '1';
};
export const isCollectionElement = (documentType) => {
  return documentType.id === '2';
};
export const isImage = (documentType) => {
  return documentType.id === '3';
};
export const isText = (documentType) => {
  return documentType.id === '4';
};
