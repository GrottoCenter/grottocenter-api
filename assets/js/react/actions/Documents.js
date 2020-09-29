import fetch from 'isomorphic-fetch';
import {
  pipe,
  keys,
  map,
  join,
  isNil,
  pathOr,
  split,
  tail,
  ifElse,
  identity,
  always,
  defaultTo,
  equals,
} from 'ramda';
import { getDocuments as queryDocuments } from '../conf/Config';

export const FETCH_DOCUMENTS = 'FETCH_DOCUMENTS';
export const FETCH_DOCUMENTS_SUCCESS = 'FETCH_DOCUMENTS_SUCCESS';
export const FETCH_DOCUMENTS_FAILURE = 'FETCH_DOCUMENTS_FAILURE';

export const fetchDocuments = () => ({
  type: FETCH_DOCUMENTS,
});

export const fetchDocumentsSuccess = (data) => ({
  type: FETCH_DOCUMENTS_SUCCESS,
  documents: data.documents,
  totalCount: data.totalCount,
});

export const fetchDocumentsFailure = (error) => ({
  type: FETCH_DOCUMENTS_FAILURE,
  error,
});

export function getDocuments(criteria) {
  const makeUrl = pipe(
    keys,
    map((c) => `${c}=${encodeURIComponent(criteria[c])}`),
    join('&'),
    (urlCriteria) => `${queryDocuments}?${urlCriteria}`,
  );

  return async (dispatch) => {
    dispatch(fetchDocuments());

    try {
      const res = await fetch(
        isNil(criteria) ? queryDocuments : makeUrl(criteria),
      );
      const data = await res.text();
      const header = await res.headers.get('Content-Range');
      const makeNumber = ifElse(identity, Number, always(1));
      const getTotalCount = (defaultCount) =>
        pipe(
          defaultTo(''),
          split('/'),
          tail,
          makeNumber,
          ifElse(equals(0), always(defaultCount), identity),
        )(header);

      const parsedData = pathOr(['documents'], [], JSON.parse(data));
      return dispatch(
        fetchDocumentsSuccess({
          documents: parsedData,
          totalCount: getTotalCount(parsedData.documents.length),
        }),
      );
    } catch (err) {
      const errorMessage = `Fetching ${getDocuments} status: ${err.status}`;
      dispatch(fetchDocumentsFailure(errorMessage));
      throw new Error(errorMessage);
    }
  };
}
