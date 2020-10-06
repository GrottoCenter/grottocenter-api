import {
  defaultTo,
  pipe,
  pathOr,
  map,
  propOr,
  reject,
  isEmpty,
  head,
  join,
} from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const makeOverview = (data) => ({
  createdBy: pathOr('', ['author', 'name'], data),
  authors: pipe(
    propOr([], 'authors'),
    map(propOr('', 'nickname')),
    reject(isEmpty),
    defaultTo([]),
  )(data),
  language: pathOr('unknown', ['mainLanguage', 'refName'], data),
  title: pipe(propOr([], 'descriptions'), head, propOr('Title', 'title'))(data),
  summary: pipe(propOr([], 'descriptions'), head, propOr('', 'body'))(data),
});

// eslint-disable-next-line no-unused-vars
export const makeOrganizations = (data) => ({
  editor: '',
  library: '',
});

export const makeDetails = (data) => ({
  identifier: propOr('', 'identifier', data),
  bbsReference: propOr('', 'refBbs', data),
  documentType: pathOr('', ['type', 'name'], data),
  publishedIn: propOr('', 'datePublication', data),
  documentFather: '',
  pages: propOr('', 'pages', data),
  subjects: pipe(
    propOr([], 'subjects'),
    map(propOr('', 'name')),
    reject(isEmpty),
    join(' - '),
  )(data),
  area: pathOr('', ['entrance', 'region'], data),
});

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
  entry: pathOr('', ['entrance', 'name'], data),
});
