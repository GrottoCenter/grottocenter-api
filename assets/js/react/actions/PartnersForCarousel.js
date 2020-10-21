import fetch from 'isomorphic-fetch';
import { findForCarouselUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

//
//
// A C T I O N S
//
//

export const FETCH_PARTNERS_FC = 'FETCH_PARTNERS_FC';
export const FETCH_PARTNERS_FC_SUCCESS = 'FETCH_PARTNERS_FC_SUCCESS';
export const FETCH_PARTNERS_FC_FAILURE = 'FETCH_PARTNERS_FC_FAILURE';

//
//
// A C T I O N S - C R E A T O R S
//
//

export const fetchPartnersForCarousel = () => ({
  type: FETCH_PARTNERS_FC,
  partners: undefined,
});

export const fetchPartnersForCarouselSuccess = (entry) => ({
  type: FETCH_PARTNERS_FC_SUCCESS,
  entry,
});

export const fetchPartnersForCarouselFailure = (error) => ({
  type: FETCH_PARTNERS_FC_FAILURE,
  error,
});

//
//
// T H U N K S
//
//

export function loadPartnersForCarousel() {
  return function(dispatch) {
    dispatch(fetchPartnersForCarousel());

    return fetch(findForCarouselUrl)
      .then((response) => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then((text) =>
        dispatch(fetchPartnersForCarouselSuccess(JSON.parse(text))),
      )
      .catch((error) =>
        dispatch(
          fetchPartnersForCarouselFailure(
            makeErrorMessage(error.message, `Fetching partners carousel`),
          ),
        ),
      );
  };
}
