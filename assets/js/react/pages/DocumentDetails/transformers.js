import {
  defaultTo,
  pipe,
  pathOr,
  map,
  propOr,
  reject,
  isEmpty,
  head,
} from 'ramda';

export const makeOverview = (data) => ({
  createdBy: pathOr('', ['author', 'nickname'], data),
  creationDate: pathOr('', ['dateInscription'], data),
  authors: pipe(
    propOr([], 'authors'),
    map(propOr('', 'nickname')),
    reject(isEmpty),
    defaultTo([]),
  )(data),
  language: pathOr('unknown', ['mainLanguage', 'refName'], data),
  title: pipe(
    propOr([], 'titles'),
    head,
    propOr('No title provided', 'text'),
  )(data),
  summary: pipe(propOr([], 'descriptions'), head, propOr('', 'text'))(data),
});

export const makeOrganizations = (data) => ({
  editor: pathOr('', ['editor', 'name'], data),
  library: pathOr('', ['library', 'name'], data),
});

export const makeDetails = (data) => {
  const formatedIdentfier = pathOr(null, ['identifierType', 'id'], data)
    ? `${propOr(
        '',
        'identifier',
        data,
      )} (${data.identifierType.id.toUpperCase()})`
    : propOr('', 'identifier', data);
  return {
    identifier: formatedIdentfier,
    bbsReference: propOr('', 'refBbs', data),
    documentType: pathOr('', ['type', 'name'], data),
    publicationDate: propOr('', 'datePublication', data),
    parentDocument: pipe(
      pathOr([], ['parent', 'titles']),
      head,
      propOr('No title provided', 'text'),
    )(data),
    pages: propOr('', 'pages', data),
    subjects: pipe(
      propOr([], 'subjects'),
      map(propOr('', 'subject')),
      reject(isEmpty),
    )(data),
    regions: pipe(
      propOr([], 'regions'),
      map(propOr('', 'name')),
      reject(isEmpty),
    )(data),
  };
};

export const makeEntities = (data) => ({
  massif: pipe(
    pathOr([], ['massif', 'names']),
    head,
    pathOr('', ['name']),
  )(data),
  cave: pipe(
    pathOr([], ['entrance', 'names']),
    head,
    pathOr('', ['cave', 'name']),
  )(data),
  entrance: pathOr('', ['entrance', 'name'], data),
});
